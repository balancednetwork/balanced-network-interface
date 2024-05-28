import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { useQuery } from '@tanstack/react-query';

import { XCallEventType } from '../types';
import { XCallMessage, XCallMessageStatus, Transaction, TransactionStatus, XCallEventMap } from './types';
import { useCreateXCallService, xCallServiceActions } from './useXCallServiceStore';
import { useXCallEventScanner, xCallEventActions } from './useXCallEventStore';
import { useFetchTransaction } from './useTransactionStore';
import { useEffect } from 'react';
import { getNetworkDisplayName } from '../utils';
import { xCallTransactionActions } from './useXCallTransactionStore';

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
): XCallMessageStatus => {
  if (!sourceTransaction) {
    return XCallMessageStatus.FAILED;
  }

  if (sourceTransaction.status === TransactionStatus.pending) {
    return XCallMessageStatus.REQUESTED;
  }

  if (sourceTransaction.status === TransactionStatus.failure) {
    return XCallMessageStatus.FAILED;
  }

  if (sourceTransaction.status === TransactionStatus.success) {
    if (events[XCallEventType.CallExecuted] && events[XCallEventType.CallExecuted].isSuccess) {
      if (destinationTransaction && destinationTransaction.status === TransactionStatus.success) {
        return XCallMessageStatus.CALL_EXECUTED;
        // return XCallMessageStatus.COMPLETED;
      }

      // return XCallMessageStatus.CALL_EXECUTED;
    }

    if (events[XCallEventType.CallMessage]) {
      return XCallMessageStatus.CALL_MESSAGE;
    }

    if (events[XCallEventType.CallMessageSent]) {
      return XCallMessageStatus.CALL_MESSAGE_SENT;
    }

    return XCallMessageStatus.AWAITING_CALL_MESSAGE_SENT;
  }

  return XCallMessageStatus.FAILED;
};

type XCallMessageStore = {
  messages: Record<string, XCallMessage>;
  get: (id: string | null) => XCallMessage | undefined;
  add: (xCallMessage: XCallMessage) => void;
  updateSourceTransaction: (id: string, { rawTx }: { rawTx: any }) => void;
  updateXCallMessageEvents: (id: string, events: XCallEventMap) => Promise<void>;
  remove: (id: string) => void;
};

export const useXCallMessageStore = create<XCallMessageStore>()(
  // devtools(
  persist(
    immer((set, get) => ({
      messages: {},
      get: (id: string | null) => {
        if (id) return get().messages[id];
      },
      add: (xCallMessage: XCallMessage) => {
        set(state => {
          state.messages[xCallMessage.id] = xCallMessage;
        });
      },
      updateSourceTransaction: (id: string, { rawTx }) => {
        const xCallMessage = get().messages[id];
        if (!xCallMessage) return;

        const xCallService = xCallServiceActions.getXCallService(xCallMessage.sourceChainId);
        const newSourceTransactionStatus = xCallService.deriveTxStatus(rawTx);

        const newSourceTransaction = {
          ...xCallMessage.sourceTransaction,
          rawEventLogs: xCallService.getTxEventLogs(rawTx),
          status: newSourceTransactionStatus,
        };
        const newStatus = deriveStatus(newSourceTransaction, xCallMessage.events, xCallMessage.destinationTransaction);

        set(state => {
          state.messages[id] = {
            ...xCallMessage,
            sourceTransaction: newSourceTransaction,
            status: newStatus,
          };
        });
      },
      updateXCallMessageEvents: async (id: string, events: XCallEventMap) => {
        const xCallMessage = get().messages[id];
        if (!xCallMessage) return;

        let destinationTransaction: Transaction | undefined = undefined;

        const oldStatus = xCallMessage.status;

        const newEvents = {
          ...xCallMessage.events,
          ...events,
        };

        if (newEvents[XCallEventType.CallExecuted]) {
          const dstXCallService = xCallServiceActions.getXCallService(xCallMessage.destinationChainId);
          const destinationTransactionHash = newEvents[XCallEventType.CallExecuted].txHash;
          const rawTx = await dstXCallService.getTxReceipt(destinationTransactionHash);

          destinationTransaction = {
            id: destinationTransactionHash,
            hash: destinationTransactionHash,
            xChainId: xCallMessage.destinationChainId,
            status: dstXCallService.deriveTxStatus(rawTx),
            rawEventLogs: dstXCallService.getTxEventLogs(rawTx),
            timestamp: Date.now(),
            // timestamp: newEvents[XCallEventType.CallExecuted].timestamp,
          };
        }
        const newStatus = deriveStatus(xCallMessage.sourceTransaction, newEvents, destinationTransaction);

        const newXCallMessage = {
          ...xCallMessage,
          events: newEvents,
          status: newStatus,
          destinationTransaction,
        };

        set(state => {
          state.messages[id] = newXCallMessage;
        });

        if (newStatus !== oldStatus) {
          if (newStatus === XCallMessageStatus.CALL_EXECUTED || newStatus === XCallMessageStatus.FAILED) {
            xCallEventActions.disableScanner(newXCallMessage.id);
            const xCallTransaction = xCallTransactionActions.getByMessageId(newXCallMessage.id);
            if (xCallTransaction) {
              xCallTransactionActions.onMessageUpdate(xCallTransaction.id, newXCallMessage);
            }
          }
        }
      },
      remove: (id: string) => {
        set(state => {
          delete state.messages[id];
        });
      },
    })),
    {
      name: 'xCallMessage-store',
      storage: createJSONStorage(() => localStorage, jsonStorageOptions),
    },
  ),
  //   { name: 'XCallMessageStore' },
  // ),
);

export const xCallMessageActions = {
  get: (id: string | null) => {
    return useXCallMessageStore.getState().get(id);
  },

  add: (xCallMessage: XCallMessage) => {
    useXCallMessageStore.getState().add(xCallMessage);
  },

  updateSourceTransaction: (id: string, { rawTx }) => {
    useXCallMessageStore.getState().updateSourceTransaction(id, { rawTx });
  },
  updateXCallMessageEvents: async (id: string, events: XCallEventMap) => {
    await useXCallMessageStore.getState().updateXCallMessageEvents(id, events);
  },

  remove: (id: string) => {
    useXCallMessageStore.getState().remove(id);
  },

  getXCallMessageStatusDescription: (xCallMessageId: string) => {
    const xCallMessage = useXCallMessageStore.getState().get(xCallMessageId);
    if (!xCallMessage) {
      return 'Unknown state.';
    }
    switch (xCallMessage.status) {
      case XCallMessageStatus.REQUESTED:
        return `Awaiting confirmation on ${getNetworkDisplayName(xCallMessage.sourceChainId)}...`;
      case XCallMessageStatus.FAILED:
        return `Transfer failed.`;
      case XCallMessageStatus.AWAITING_CALL_MESSAGE_SENT:
        return `Awaiting confirmation on ${getNetworkDisplayName(xCallMessage.sourceChainId)}...`;
      case XCallMessageStatus.CALL_MESSAGE_SENT:
        return `Finalising transaction on ${getNetworkDisplayName(xCallMessage.destinationChainId)}...`;
      case XCallMessageStatus.CALL_MESSAGE:
        return `Finalising transaction on ${getNetworkDisplayName(xCallMessage.destinationChainId)}...`;
      case XCallMessageStatus.CALL_EXECUTED:
        return `Complete.`;
      default:
        return `Unknown state.`;
    }
  },
};

export const useFetchXCallMessageEvents = (xCallMessage?: XCallMessage) => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['xCallMessage-events', xCallMessage?.id],
    queryFn: async () => {
      if (!xCallMessage) {
        return null;
      }

      const { sourceChainId, destinationChainId, sourceTransaction } = xCallMessage;

      let events: XCallEventMap = {};
      if (xCallMessage.status === XCallMessageStatus.AWAITING_CALL_MESSAGE_SENT) {
        const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
        events = await srcChainXCallService.getSourceEvents(sourceTransaction);
      } else if (
        xCallMessage.status === XCallMessageStatus.CALL_MESSAGE_SENT ||
        xCallMessage.status === XCallMessageStatus.CALL_MESSAGE
        // || xCallMessage.status === XCallMessageStatus.CALL_EXECUTED
      ) {
        const callMessageSentEvent = xCallMessage.events[XCallEventType.CallMessageSent];
        if (callMessageSentEvent) {
          events = xCallEventActions.getDestinationEvents(destinationChainId, callMessageSentEvent.sn);
        }
      }

      return events;
    },
    refetchInterval: 2000,
    enabled:
      !!xCallMessage?.id &&
      xCallMessage?.status !== XCallMessageStatus.CALL_EXECUTED &&
      xCallMessage?.status !== XCallMessageStatus.FAILED,
  });

  return {
    events,
    isLoading,
  };
};

export const XCallMessageUpdater = ({ xCallMessage }: { xCallMessage: XCallMessage }) => {
  const { id, sourceChainId, destinationChainId, destinationChainInitialBlockHeight, status } = xCallMessage || {};

  useCreateXCallService(sourceChainId);
  useCreateXCallService(destinationChainId);

  useXCallEventScanner(id);

  const { rawTx } = useFetchTransaction(xCallMessage?.sourceTransaction);
  const { events } = useFetchXCallMessageEvents(xCallMessage);

  useEffect(() => {
    if (id && rawTx) {
      xCallMessageActions.updateSourceTransaction(id, { rawTx });
    }
  }, [id, rawTx]);

  useEffect(() => {
    if (id && events) {
      xCallMessageActions.updateXCallMessageEvents(id, events);
    }
  }, [id, events]);

  useEffect(() => {
    if (id) {
      if (
        status !== XCallMessageStatus.CALL_EXECUTED &&
        status !== XCallMessageStatus.FAILED &&
        !xCallEventActions.isScannerEnabled(destinationChainId)
      ) {
        xCallEventActions.enableScanner(id, destinationChainId, BigInt(destinationChainInitialBlockHeight));
      }
    }
  }, [id, status, destinationChainId, destinationChainInitialBlockHeight]);

  return null;
};

export const AllXCallMessagesUpdater = () => {
  const xCallMessages = useXCallMessageStore(state => Object.values(state.messages));

  return (
    <>
      {xCallMessages
        .filter(x => x.status !== XCallMessageStatus.CALL_EXECUTED && x.status !== XCallMessageStatus.FAILED)
        .map(xCallMessage => (
          <XCallMessageUpdater key={xCallMessage.id} xCallMessage={xCallMessage} />
        ))}
    </>
  );
};
