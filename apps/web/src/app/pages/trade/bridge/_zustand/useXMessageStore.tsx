import React from 'react';
import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { useQuery } from '@tanstack/react-query';

import { XCallEventType } from '../types';
import { XMessage, XMessageStatus, Transaction, TransactionStatus, XCallEventMap } from './types';
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
    if (events[XCallEventType.CallExecuted] && events[XCallEventType.CallExecuted].isSuccess) {
      if (destinationTransaction && destinationTransaction.status === TransactionStatus.success) {
        return XMessageStatus.CALL_EXECUTED;
        // return XMessageStatus.COMPLETED;
      }

      // return XMessageStatus.CALL_EXECUTED;
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
  add: (xCallMessage: XMessage) => void;
  updateSourceTransaction: (id: string, { rawTx }: { rawTx: any }) => void;
  updateXMessageEvents: (id: string, events: XCallEventMap) => Promise<void>;
  remove: (id: string) => void;
};

export const useXMessageStore = create<XMessageStore>()(
  // devtools(
  persist(
    immer((set, get) => ({
      messages: {},
      get: (id: string | null) => {
        if (id) return get().messages[id];
      },
      add: (xCallMessage: XMessage) => {
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
      updateXMessageEvents: async (id: string, events: XCallEventMap) => {
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

        const newXMessage = {
          ...xCallMessage,
          events: newEvents,
          status: newStatus,
          destinationTransaction,
        };

        set(state => {
          state.messages[id] = newXMessage;
        });

        if (newStatus !== oldStatus) {
          if (newStatus === XMessageStatus.CALL_EXECUTED || newStatus === XMessageStatus.FAILED) {
            xCallEventActions.disableScanner(newXMessage.id);
            const xCallTransaction = xCallTransactionActions.getByMessageId(newXMessage.id);
            if (xCallTransaction) {
              xCallTransactionActions.onMessageUpdate(xCallTransaction.id, newXMessage);
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
  //   { name: 'XMessageStore' },
  // ),
);

export const xCallMessageActions = {
  get: (id: string | null) => {
    return useXMessageStore.getState().get(id);
  },

  add: (xCallMessage: XMessage) => {
    useXMessageStore.getState().add(xCallMessage);
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

  getXMessageStatusDescription: (xCallMessageId: string) => {
    const xCallMessage = useXMessageStore.getState().get(xCallMessageId);
    if (!xCallMessage) {
      return 'Unknown state.';
    }
    switch (xCallMessage.status) {
      case XMessageStatus.REQUESTED:
        return `Awaiting confirmation on ${getNetworkDisplayName(xCallMessage.sourceChainId)}...`;
      case XMessageStatus.FAILED:
        return `Transfer failed.`;
      case XMessageStatus.AWAITING_CALL_MESSAGE_SENT:
        return `Awaiting confirmation on ${getNetworkDisplayName(xCallMessage.sourceChainId)}...`;
      case XMessageStatus.CALL_MESSAGE_SENT:
        return `Finalising transaction on ${getNetworkDisplayName(xCallMessage.destinationChainId)}...`;
      case XMessageStatus.CALL_MESSAGE:
        return `Finalising transaction on ${getNetworkDisplayName(xCallMessage.destinationChainId)}...`;
      case XMessageStatus.CALL_EXECUTED:
        return `Complete.`;
      default:
        return `Unknown state.`;
    }
  },
};

export const useFetchXMessageEvents = (xCallMessage?: XMessage) => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['xCallMessage-events', xCallMessage?.id],
    queryFn: async () => {
      if (!xCallMessage) {
        return null;
      }

      const { sourceChainId, destinationChainId, sourceTransaction } = xCallMessage;

      let events: XCallEventMap = {};
      if (xCallMessage.status === XMessageStatus.AWAITING_CALL_MESSAGE_SENT) {
        const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
        events = await srcChainXCallService.getSourceEvents(sourceTransaction);
      } else if (
        xCallMessage.status === XMessageStatus.CALL_MESSAGE_SENT ||
        xCallMessage.status === XMessageStatus.CALL_MESSAGE
        // || xCallMessage.status === XMessageStatus.CALL_EXECUTED
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
      xCallMessage?.status !== XMessageStatus.CALL_EXECUTED &&
      xCallMessage?.status !== XMessageStatus.FAILED,
  });

  return {
    events,
    isLoading,
  };
};

export const XMessageUpdater = ({ xCallMessage }: { xCallMessage: XMessage }) => {
  const { id, sourceChainId, destinationChainId, destinationChainInitialBlockHeight, status } = xCallMessage || {};

  useCreateXCallService(sourceChainId);
  useCreateXCallService(destinationChainId);

  useXCallEventScanner(id);

  const { rawTx } = useFetchTransaction(xCallMessage?.sourceTransaction);
  const { events } = useFetchXMessageEvents(xCallMessage);

  useEffect(() => {
    if (id && rawTx) {
      xCallMessageActions.updateSourceTransaction(id, { rawTx });
    }
  }, [id, rawTx]);

  useEffect(() => {
    if (id && events) {
      xCallMessageActions.updateXMessageEvents(id, events);
    }
  }, [id, events]);

  useEffect(() => {
    if (id) {
      if (
        status !== XMessageStatus.CALL_EXECUTED &&
        status !== XMessageStatus.FAILED &&
        !xCallEventActions.isScannerEnabled(destinationChainId)
      ) {
        xCallEventActions.enableScanner(id, destinationChainId, BigInt(destinationChainInitialBlockHeight));
      }
    }
  }, [id, status, destinationChainId, destinationChainInitialBlockHeight]);

  return null;
};

export const AllXMessagesUpdater = () => {
  const xCallMessages = useXMessageStore(state => Object.values(state.messages));

  return (
    <>
      {xCallMessages
        .filter(x => x.status !== XMessageStatus.CALL_EXECUTED && x.status !== XMessageStatus.FAILED)
        .map(xCallMessage => (
          <XMessageUpdater key={xCallMessage.id} xCallMessage={xCallMessage} />
        ))}
    </>
  );
};
