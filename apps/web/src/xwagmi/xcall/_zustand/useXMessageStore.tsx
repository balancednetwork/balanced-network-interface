import React, { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { getNetworkDisplayName } from '@/utils/xTokens';
import { getXPublicClient } from '@/xwagmi/actions';
import { XCallEventType } from '../types';
import { Transaction, TransactionStatus, XCallEventMap, XMessage, XMessageStatus } from './types';
import { useFetchTransaction } from './useTransactionStore';
import { useXCallEventScanner, xCallEventActions } from './useXCallEventStore';
import { xTransactionActions } from './useXTransactionStore';

const jsonStorageOptions = {
  reviver: (key, value: any) => {
    if (!value) return value;

    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substring(8));
    }

    return value;
  },
  replacer: (key, value) => {
    if (typeof value === 'bigint') {
      return `BIGINT::${value}`;
    } else {
      return value;
    }
  },
};

// TODO: review logic
export const deriveStatus = (
  sourceTransaction: Transaction,
  events: XCallEventMap,
  destinationTransaction: Transaction | undefined = undefined,
): XMessageStatus => {
  if (!sourceTransaction) {
    return XMessageStatus.FAILED;
  }

  if (sourceTransaction.status === TransactionStatus.pending) {
    return XMessageStatus.REQUESTED;
  }

  if (sourceTransaction.status === TransactionStatus.failure) {
    return XMessageStatus.FAILED;
  }

  if (sourceTransaction.status === TransactionStatus.success) {
    if (events[XCallEventType.CallExecuted]) {
      if (
        events[XCallEventType.CallExecuted].code === 1 &&
        destinationTransaction &&
        destinationTransaction.status === TransactionStatus.success
      ) {
        return XMessageStatus.CALL_EXECUTED;
      } else {
        return XMessageStatus.FAILED; // REVERTED?
      }
    }

    if (events[XCallEventType.CallMessage]) {
      return XMessageStatus.CALL_MESSAGE;
    }

    if (events[XCallEventType.CallMessageSent]) {
      return XMessageStatus.CALL_MESSAGE_SENT;
    }

    return XMessageStatus.AWAITING_CALL_MESSAGE_SENT;
  }

  return XMessageStatus.FAILED;
};

type XMessageStore = {
  messages: Record<string, XMessage>;
  get: (id: string | null) => XMessage | undefined;
  add: (xMessage: XMessage) => void;
  updateSourceTransaction: (id: string, { rawTx }: { rawTx: any }) => void;
  updateXMessageEvents: (id: string, events: XCallEventMap) => Promise<void>;
  remove: (id: string) => void;
  refreshXMessage: (id: string) => void;
};

export const useXMessageStore = create<XMessageStore>()(
  // devtools(
  persist(
    immer((set, get) => ({
      messages: {},
      get: (id: string | null) => {
        if (id) return get().messages[id];
      },
      add: (xMessage: XMessage) => {
        if (get().messages[xMessage.id]) return;
        set(state => {
          state.messages[xMessage.id] = xMessage;
        });
      },
      updateSourceTransaction: (id: string, { rawTx }) => {
        const xMessage = get().messages[id];
        if (!xMessage) return;

        const xPublicClient = getXPublicClient(xMessage.sourceChainId);

        const newSourceTransactionStatus = xPublicClient.deriveTxStatus(rawTx);

        const newSourceTransaction = {
          ...xMessage.sourceTransaction,
          rawEventLogs: xPublicClient.getTxEventLogs(rawTx),
          status: newSourceTransactionStatus,
        };
        const newStatus = deriveStatus(newSourceTransaction, xMessage.events, xMessage.destinationTransaction);

        set(state => {
          state.messages[id] = {
            ...xMessage,
            sourceTransaction: newSourceTransaction,
            status: newStatus,
          };
        });
      },
      updateXMessageEvents: async (id: string, events: XCallEventMap) => {
        const xMessage = get().messages[id];
        if (!xMessage) return;

        let destinationTransaction: Transaction | undefined = undefined;

        const oldStatus = xMessage.status;

        const newEvents = {
          ...xMessage.events,
          ...events,
        };

        if (newEvents[XCallEventType.CallExecuted]) {
          const dstXPublicClient = getXPublicClient(xMessage.destinationChainId);

          const destinationTransactionHash = newEvents[XCallEventType.CallExecuted].txHash;
          const rawTx = await dstXPublicClient.getTxReceipt(destinationTransactionHash);

          destinationTransaction = {
            id: destinationTransactionHash,
            hash: destinationTransactionHash,
            xChainId: xMessage.destinationChainId,
            status: dstXPublicClient.deriveTxStatus(rawTx),
            rawEventLogs: dstXPublicClient.getTxEventLogs(rawTx),
            timestamp: Date.now(),
            // timestamp: newEvents[XCallEventType.CallExecuted].timestamp,
          };
        }
        const newStatus = deriveStatus(xMessage.sourceTransaction, newEvents, destinationTransaction);

        const newXMessage = {
          ...xMessage,
          events: newEvents,
          status: newStatus,
          destinationTransaction,
        };

        set(state => {
          state.messages[id] = newXMessage;
        });

        if (newStatus !== oldStatus) {
          console.log('XMessage status changed:', id, oldStatus, '->', newStatus);
          if (newStatus === XMessageStatus.CALL_EXECUTED || newStatus === XMessageStatus.FAILED) {
            xCallEventActions.disableScanner(newXMessage.id);
            const xTransaction = xTransactionActions.getByMessageId(newXMessage.id);
            if (xTransaction) {
              xTransactionActions.onMessageUpdate(xTransaction.id, newXMessage);
            }
          }
        }
      },
      remove: (id: string) => {
        set(state => {
          delete state.messages[id];
        });
      },
      refreshXMessage: (id: string) => {
        const xMessage = get().messages[id];
        if (!xMessage) return;

        const { sourceTransaction, events, destinationTransaction, status: oldStatus } = xMessage;

        const newStatus = deriveStatus(sourceTransaction, events, destinationTransaction);

        set(state => {
          state.messages[id]['status'] = newStatus;
        });

        const xTransaction = xTransactionActions.getByMessageId(xMessage.id);
        if (xTransaction) {
          xTransactionActions.onMessageUpdate(xTransaction.id, xMessage);
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
  //   { name: 'XMessageStore' },
  // ),
);

export const xMessageActions = {
  get: (id: string | null) => {
    return useXMessageStore.getState().get(id);
  },

  add: (xMessage: XMessage) => {
    useXMessageStore.getState().add(xMessage);
  },

  updateSourceTransaction: (id: string, { rawTx }) => {
    useXMessageStore.getState().updateSourceTransaction(id, { rawTx });
  },
  updateXMessageEvents: async (id: string, events: XCallEventMap) => {
    await useXMessageStore.getState().updateXMessageEvents(id, events);
  },

  remove: (id: string) => {
    useXMessageStore.getState().remove(id);
  },

  refreshXMessage: (id: string) => {
    useXMessageStore.getState().refreshXMessage(id);
  },

  getXMessageStatusDescription: (xMessageId: string) => {
    const xMessage = useXMessageStore.getState().get(xMessageId);
    if (!xMessage) {
      return 'xMessage not found.';
    }
    switch (xMessage.status) {
      case XMessageStatus.REQUESTED:
        return `Awaiting confirmation on ${getNetworkDisplayName(xMessage.sourceChainId)}...`;
      case XMessageStatus.FAILED:
        return `Transfer failed.`;
      case XMessageStatus.AWAITING_CALL_MESSAGE_SENT:
        return `Awaiting confirmation on ${getNetworkDisplayName(xMessage.sourceChainId)}...`;
      case XMessageStatus.CALL_MESSAGE_SENT:
        return `Finalising transaction on ${getNetworkDisplayName(xMessage.destinationChainId)}...`;
      case XMessageStatus.CALL_MESSAGE:
        return `Finalising transaction on ${getNetworkDisplayName(xMessage.destinationChainId)}...`;
      case XMessageStatus.CALL_EXECUTED:
        return `Complete.`;
      default:
        return `Unknown state.`;
    }
  },
};

export const useFetchXMessageEvents = (xMessage?: XMessage) => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['xMessage-events', xMessage?.id],
    queryFn: async () => {
      if (!xMessage) {
        return null;
      }

      const { sourceChainId, destinationChainId, sourceTransaction } = xMessage;

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

export const XMessageUpdater = ({ xMessage }: { xMessage: XMessage }) => {
  const { id, destinationChainId, destinationChainInitialBlockHeight, status } = xMessage || {};

  useXCallEventScanner(id);

  const { rawTx } = useFetchTransaction(xMessage?.sourceTransaction);
  const { events } = useFetchXMessageEvents(xMessage);

  useEffect(() => {
    if (id && rawTx) {
      xMessageActions.updateSourceTransaction(id, { rawTx });
    }
  }, [id, rawTx]);

  useEffect(() => {
    if (id && events) {
      xMessageActions.updateXMessageEvents(id, events);
    }
  }, [id, events]);

  useEffect(() => {
    if (id) {
      if (
        status !== XMessageStatus.CALL_EXECUTED &&
        status !== XMessageStatus.FAILED &&
        !xCallEventActions.isScannerEnabled(id)
      ) {
        xCallEventActions.enableScanner(id, destinationChainId, BigInt(destinationChainInitialBlockHeight));
      }
    }
  }, [id, status, destinationChainId, destinationChainInitialBlockHeight]);

  return null;
};

export const AllXMessagesUpdater = () => {
  const xMessages = useXMessageStore(state => Object.values(state.messages));

  return (
    <>
      {xMessages
        .filter(x => x.status !== XMessageStatus.CALL_EXECUTED && x.status !== XMessageStatus.FAILED)
        .map(xMessage => (
          <XMessageUpdater key={xMessage.id} xMessage={xMessage} />
        ))}
    </>
  );
};
