import React, { useEffect, useState } from 'react';

import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { getXPublicClient } from '@/actions';
import { xChainMap } from '@/constants/xChains';
import { jsonStorageOptions } from '@/utils/zustand';
import { XCallEventType, XTransaction } from '../types';
import { TransactionStatus, XCallEventMap, XMessage, XMessageStatus } from '../types';
import { transactionActions } from './useTransactionStore';
import { useXCallEventScanner, xCallEventActions } from './useXCallEventStore';
import { useXCallScannerStore, useXCallScannerSubscription } from './useXCallScannerStore';
import { xTransactionActions } from './useXTransactionStore';

// TODO: review logic
export const deriveStatus = (events: XCallEventMap): XMessageStatus => {
  if (events[XCallEventType.CallExecuted]) {
    if (events[XCallEventType.CallExecuted].code === 1) {
      // TODO: confirm if code is set correctly for all XPublicClient implementations
      return XMessageStatus.CALL_EXECUTED;
    } else {
      return XMessageStatus.ROLLBACKED;
    }
  }

  if (events[XCallEventType.CallMessage]) {
    return XMessageStatus.CALL_MESSAGE;
  }

  if (events[XCallEventType.CallMessageSent]) {
    return XMessageStatus.CALL_MESSAGE_SENT;
  }

  return XMessageStatus.AWAITING_CALL_MESSAGE_SENT;
};

const isXMessagePending = (status: XMessageStatus) => {
  return (
    status !== XMessageStatus.CALL_EXECUTED && status !== XMessageStatus.FAILED && status !== XMessageStatus.ROLLBACKED
  );
};

type XMessageStore = {
  messages: Record<string, XMessage>;
  get: (id: string | null) => XMessage | undefined;
  add: (xMessage: XMessage) => void;
  updateStatus: (id: string, status: XMessageStatus) => void;
  updateXMessageEvents: (id: string, events: XCallEventMap) => Promise<void>;
  updateXMessageXCallScannerData: (id: string, data: any) => void;
  remove: (id: string) => void;
  onMessageUpdate: (id: string) => void;
  createSecondaryMessage: (xTransaction: XTransaction, primaryMessage: XMessage) => void;
};

export const useXMessageStore = create<XMessageStore>()(
  // devtools(
  persist(
    immer((set, get) => ({
      messages: {},
      get: (id: string | null) => {
        if (id) return get().messages[id];
        return undefined;
      },
      add: (xMessage: XMessage) => {
        if (get().messages[xMessage.id]) return;
        set(state => {
          state.messages[xMessage.id] = xMessage;
        });
      },

      updateStatus: (id: string, status: XMessageStatus) => {
        const xMessage = get().messages[id];
        if (!xMessage) return;

        const oldStatus = xMessage.status;
        if (oldStatus === status) return;

        set(state => {
          state.messages[id].status = status;
        });

        console.log('XMessage status changed:', id, oldStatus, '->', status);
        if (!isXMessagePending(status)) {
          xCallEventActions.disableScanner(xMessage.id);
          get().onMessageUpdate(id);
        }
      },

      updateXMessageEvents: async (id: string, events: XCallEventMap) => {
        const xMessage = get().messages[id];
        if (!xMessage) return;

        const newEvents = {
          ...xMessage.events,
          ...events,
        };

        let destinationTransactionHash;
        if (newEvents[XCallEventType.CallExecuted]) {
          destinationTransactionHash = newEvents[XCallEventType.CallExecuted].txHash;
        }

        const newXMessage: XMessage = {
          ...xMessage,
          events: newEvents,
          destinationTransactionHash,
        };

        set(state => {
          state.messages[id] = newXMessage;
        });

        // TODO: confirm if an additional check is needed
        // if (xMessage.status === XMessageStatus.AWAITING_CALL_MESSAGE_SENT) {
        const newStatus = deriveStatus(newEvents);
        get().updateStatus(id, newStatus);
        // }
      },
      remove: (id: string) => {
        set(state => {
          delete state.messages[id];
        });
      },

      updateXMessageXCallScannerData: (id: string, data: any) => {
        const xMessage = get().messages[id];

        let newStatus;
        switch (data.status) {
          case 'failed':
            newStatus = XMessageStatus.FAILED;
            break;
          case 'pending':
            newStatus = XMessageStatus.CALL_MESSAGE_SENT;
            break;
          case 'delivered':
            newStatus = XMessageStatus.CALL_MESSAGE;
            break;
          case 'executed':
            if (!data.dest_error || data.dest_error === 'success') {
              newStatus = XMessageStatus.CALL_EXECUTED;
            } else {
              newStatus = XMessageStatus.ROLLBACKED;
            }
            break;
          case 'rollbacked':
            newStatus = XMessageStatus.ROLLBACKED;
            break;
          default:
            break;
        }

        const newXMessage: XMessage = {
          ...xMessage,
          destinationTransactionHash: data.dest_tx_hash,
          xCallScannerData: data,
        };

        set(state => {
          state.messages[id] = newXMessage;
        });

        if (newStatus) {
          get().updateStatus(id, newStatus);
        }
      },

      onMessageUpdate: (id: string) => {
        const xMessage = get().messages[id];
        if (!xMessage) return;

        console.log('onMessageUpdate', { xMessage });
        const xTransaction = xTransactionActions.get(xMessage.xTransactionId);
        if (!xTransaction) return;

        if (xMessage.isPrimary) {
          if (xMessage.status === XMessageStatus.CALL_EXECUTED) {
            if (xTransaction.secondaryMessageRequired) {
              get().createSecondaryMessage(xTransaction, xMessage);
            } else {
              xTransactionActions.success(xTransaction.id);
            }
          }

          if (xMessage.status === XMessageStatus.FAILED || xMessage.status === XMessageStatus.ROLLBACKED) {
            xTransactionActions.fail(xTransaction.id);
          }
        } else {
          if (xMessage.status === XMessageStatus.CALL_EXECUTED) {
            xTransactionActions.success(xTransaction.id);
          }

          if (xMessage.status === XMessageStatus.FAILED || xMessage.status === XMessageStatus.ROLLBACKED) {
            xTransactionActions.fail(xTransaction.id);
          }
        }
      },

      createSecondaryMessage: (xTransaction: XTransaction, primaryMessage: XMessage) => {
        if (xChainMap[xTransaction.finalDestinationChainId].useXCallScanner) {
          if (!primaryMessage.destinationTransactionHash) {
            throw new Error('destinationTransactionHash is undefined'); // it should not happen
          }

          const sourceChainId = primaryMessage.destinationChainId;
          const destinationChainId = xTransaction.finalDestinationChainId;

          const secondaryMessageId = `${sourceChainId}/${primaryMessage.destinationTransactionHash}`;
          const secondaryMessage: XMessage = {
            id: secondaryMessageId,
            xTransactionId: xTransaction.id,
            sourceChainId,
            destinationChainId,
            sourceTransactionHash: primaryMessage.destinationTransactionHash,
            status: XMessageStatus.REQUESTED,
            events: {},
            destinationChainInitialBlockHeight: xTransaction.finalDestinationChainInitialBlockHeight,
            isPrimary: false,
            useXCallScanner: true,
            createdAt: Date.now(),
          };

          get().add(secondaryMessage);
        } else {
          if (!primaryMessage.destinationTransactionHash) {
            throw new Error('destinationTransactionHash is undefined'); // it should not happen
          }
          transactionActions.add(primaryMessage.destinationChainId, {
            hash: primaryMessage.destinationTransactionHash,
          });

          const sourceChainId = primaryMessage.destinationChainId;
          const destinationChainId = xTransaction.finalDestinationChainId;

          const secondaryMessageId = `${sourceChainId}/${primaryMessage.destinationTransactionHash}`;
          const secondaryMessage: XMessage = {
            id: secondaryMessageId,
            xTransactionId: xTransaction.id,
            sourceChainId,
            destinationChainId,
            sourceTransactionHash: primaryMessage.destinationTransactionHash,
            status: XMessageStatus.REQUESTED,
            events: {},
            destinationChainInitialBlockHeight: xTransaction.finalDestinationChainInitialBlockHeight,
            isPrimary: false,
            useXCallScanner: false,
            createdAt: Date.now(),
          };

          get().add(secondaryMessage);
        }
      },
    })),
    {
      name: 'xMessage-store',
      storage: createJSONStorage(() => localStorage, jsonStorageOptions),
      version: 1,
      migrate: (state, version) => {
        return { messages: {} };
      },
    },
  ),
);

export const xMessageActions = {
  get: (id: string | null) => {
    return useXMessageStore.getState().get(id);
  },

  getOf: (xTransactionId: string, isPrimary: boolean): XMessage | undefined => {
    return Object.values(useXMessageStore.getState().messages).find(
      message => message.isPrimary === isPrimary && message.xTransactionId === xTransactionId,
    );
  },

  add: (xMessage: XMessage) => {
    useXMessageStore.getState().add(xMessage);
  },

  updateStatus: (id: string, status: XMessageStatus) => {
    useXMessageStore.getState().updateStatus(id, status);
  },

  updateXMessageEvents: async (id: string, events: XCallEventMap) => {
    await useXMessageStore.getState().updateXMessageEvents(id, events);
  },
  updateXMessageXCallScannerData: (id: string, data: any) => {
    useXMessageStore.getState().updateXMessageXCallScannerData(id, data);
  },

  remove: (id: string) => {
    useXMessageStore.getState().remove(id);
  },
};

export const useFetchXMessageEvents = (xMessage?: XMessage) => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['xMessage-events', xMessage?.id],
    queryFn: async () => {
      if (!xMessage) {
        return null;
      }

      const { sourceChainId, destinationChainId, sourceTransactionHash } = xMessage;

      const sourceTransaction = transactionActions.get(sourceTransactionHash);
      if (!sourceTransaction) {
        return null;
      }

      let events: XCallEventMap = {};
      if (xMessage.status === XMessageStatus.AWAITING_CALL_MESSAGE_SENT) {
        const srcXPublicClient = getXPublicClient(sourceChainId);
        const callMessageSentEvent = srcXPublicClient.getCallMessageSentEvent(sourceTransaction);
        if (callMessageSentEvent) {
          return {
            [XCallEventType.CallMessageSent]: callMessageSentEvent,
          };
        }
      } else if (
        xMessage.status === XMessageStatus.CALL_MESSAGE_SENT ||
        xMessage.status === XMessageStatus.CALL_MESSAGE
        // || xMessage.status === XMessageStatus.CALL_EXECUTED
      ) {
        const callMessageSentEvent = xMessage.events[XCallEventType.CallMessageSent];
        if (callMessageSentEvent) {
          events = xCallEventActions.getDestinationEvents(destinationChainId, callMessageSentEvent.sn);
        }
      }

      return events;
    },
    refetchInterval: 2000,
    enabled:
      !!xMessage?.id && xMessage?.status !== XMessageStatus.CALL_EXECUTED && xMessage?.status !== XMessageStatus.FAILED,
  });

  return {
    events,
    isLoading,
  };
};

const XMessageUpdater = ({ xMessage }: { xMessage: XMessage }) => {
  const { id, destinationChainId, destinationChainInitialBlockHeight, status, sourceTransactionHash, createdAt } =
    xMessage || {};

  useXCallEventScanner(id);

  const [isStale, setIsStale] = useState(false);
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setIsStale(now - createdAt >= 1 * 60 * 1000); // 1 min
    }, 1000);

    return () => clearInterval(interval);
  }, [createdAt]);

  useEffect(() => {
    if (isStale && isXMessagePending(status)) {
      xCallEventActions.disableScanner(id);
      useXMessageStore.setState(state => {
        state.messages[id].useXCallScanner = true;
      });
    }
  }, [isStale, status, id]);

  const sourceTransaction = transactionActions.get(sourceTransactionHash);
  useEffect(() => {
    if (sourceTransaction) {
      if (sourceTransaction.status === TransactionStatus.success) {
        xMessageActions.updateStatus(xMessage.id, XMessageStatus.AWAITING_CALL_MESSAGE_SENT);
      } else if (sourceTransaction.status === TransactionStatus.failure) {
        xMessageActions.updateStatus(xMessage.id, XMessageStatus.FAILED);
      }
    }
  }, [sourceTransaction, xMessage.id]);

  const { events } = useFetchXMessageEvents(xMessage);
  useEffect(() => {
    if (id && events) {
      xMessageActions.updateXMessageEvents(id, events);
    }
  }, [id, events]);

  useEffect(() => {
    if (id) {
      if (isXMessagePending(status) && !xCallEventActions.isScannerEnabled(id)) {
        xCallEventActions.enableScanner(id, destinationChainId, BigInt(destinationChainInitialBlockHeight));
      }
    }
  }, [id, status, destinationChainId, destinationChainInitialBlockHeight]);

  return null;
};

const XMessageUpdater2 = ({ xMessage }: { xMessage: XMessage }) => {
  const { sourceChainId, sourceTransactionHash } = xMessage;

  const sourceTransaction = transactionActions.get(sourceTransactionHash);
  useEffect(() => {
    if (sourceTransaction) {
      if (sourceTransaction.status === TransactionStatus.success) {
        xMessageActions.updateStatus(xMessage.id, XMessageStatus.CALL_MESSAGE_SENT);
      } else if (sourceTransaction.status === TransactionStatus.failure) {
        xMessageActions.updateStatus(xMessage.id, XMessageStatus.FAILED);
      }
    }
  }, [sourceTransaction, xMessage.id]);

  const messageWS = useXCallScannerStore(state => state.messages[sourceTransactionHash]);

  const { data: message, isLoading } = useQuery({
    queryKey: ['xcallscanner', sourceChainId, sourceTransactionHash],
    queryFn: async () => {
      const url = `https://xcallscan.xyz/api/search?value=${sourceTransactionHash}`;
      const response = await axios.get(url);

      // console.log(`xcallscanner response for ${sourceTransactionHash}`, response.data);

      const messages = response.data?.data || [];
      return messages.find((m: any) => m.src_tx_hash === sourceTransactionHash) || null;
    },
    refetchInterval: 2000,
    enabled: Boolean(sourceTransactionHash),
  });

  useEffect(() => {
    if (messageWS) {
      xMessageActions.updateXMessageXCallScannerData(xMessage.id, messageWS);
    } else if (message && !isLoading) {
      xMessageActions.updateXMessageXCallScannerData(xMessage.id, message);
    }
  }, [messageWS, message, isLoading, xMessage.id]);

  return null;
};

export const AllXMessagesUpdater = () => {
  useXCallScannerSubscription();

  const xMessages = useXMessageStore(state => Object.values(state.messages));

  return (
    <>
      {xMessages
        .filter(x => isXMessagePending(x.status))
        .map(xMessage => (
          <>
            {xMessage.useXCallScanner ? (
              <XMessageUpdater2 key={xMessage.id} xMessage={xMessage} />
            ) : (
              <XMessageUpdater key={xMessage.id} xMessage={xMessage} />
            )}
          </>
        ))}
    </>
  );
};

// export const AllXTransactionsUpdater = () => {
//   useXCallScannerSubscription();

//   const xTransactions = useXTransactionStore(state =>
//     Object.values(state.transactions).filter(x => x.status === XTransactionStatus.pending),
//   );

//   return (
//     <>
//       {xTransactions.map(xTransaction => {
//         const primaryMessage = xMessageActions.getOf(xTransaction.id, true);
//         const secondaryMessage = xMessageActions.getOf(xTransaction.id, false);

//         return (
//           <div key={xTransaction.id}>
//             {primaryMessage && primaryMessage.useXCallScanner && <XMessageUpdater2 xMessage={primaryMessage} />}
//             {secondaryMessage && secondaryMessage.useXCallScanner && <XMessageUpdater2 xMessage={secondaryMessage} />}
//           </div>
//         );
//       })}
//     </>
//   );
// };
