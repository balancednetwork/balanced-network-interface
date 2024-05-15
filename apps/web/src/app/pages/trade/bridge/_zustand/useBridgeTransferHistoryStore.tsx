import { create } from 'zustand';
import { devtools, persist, createJSONStorage } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount } from '@balancednetwork/sdk-core';

import { XCallEventType } from '../types';
import { BridgeTransfer, BridgeTransferStatus, Transaction, TransactionStatus, XCallEventMap } from './types';
import { xCallServiceActions } from './useXCallServiceStore';
import { xCallEventActions } from './useXCallEventStore';

BigInt.prototype['toJSON'] = function () {
  return 'BIGINT::' + this.toString();
};

// TODO: review logic
export const deriveStatus = (
  sourceTransaction: Transaction,
  events: XCallEventMap,
  destinationTransaction: Transaction | undefined = undefined,
): BridgeTransferStatus => {
  if (!sourceTransaction) {
    return BridgeTransferStatus.TRANSFER_FAILED;
  }

  if (sourceTransaction.status === TransactionStatus.pending) {
    return BridgeTransferStatus.TRANSFER_REQUESTED;
  }

  if (sourceTransaction.status === TransactionStatus.failure) {
    return BridgeTransferStatus.TRANSFER_FAILED;
  }

  if (sourceTransaction.status === TransactionStatus.success) {
    if (events[XCallEventType.CallExecuted] && events[XCallEventType.CallExecuted].isSuccess) {
      if (destinationTransaction && destinationTransaction.status === TransactionStatus.success) {
        return BridgeTransferStatus.CALL_EXECUTED;
        // return BridgeTransferStatus.TRANSFER_COMPLETED;
      }

      // return BridgeTransferStatus.CALL_EXECUTED;
    }

    if (events[XCallEventType.CallMessage]) {
      return BridgeTransferStatus.CALL_MESSAGE;
    }

    if (events[XCallEventType.CallMessageSent]) {
      return BridgeTransferStatus.CALL_MESSAGE_SENT;
    }

    return BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT;
  }

  return BridgeTransferStatus.TRANSFER_FAILED;
};

const storage = createJSONStorage(() => sessionStorage, {
  reviver: (key, value: any) => {
    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substr(8));
    }

    if (
      typeof value === 'object' &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('numerator') &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('denominator') &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('currency') &&
      // biome-ignore lint/suspicious/noPrototypeBuiltins: <explanation>
      value.hasOwnProperty('decimalScale')
    ) {
      try {
        const obj = CurrencyAmount.fromFractionalAmount(value.currency, value.numerator, value.denominator);
        return obj;
      } catch (e) {
        console.log(e);
      }
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
});

type BridgeTransferHistoryStore = {
  transfers: Record<string, BridgeTransfer>;
  getTransfer: (id: string | null) => BridgeTransfer | undefined;
  addTransfer: (transfer: BridgeTransfer) => void;
  updateSourceTransaction: (id: string, { rawTx }: { rawTx: any }) => void;
  updateTransferEvents: (id: string, events: XCallEventMap) => Promise<void>;
  remove: (id: string) => void;
};

export const useBridgeTransferHistoryStore = create<BridgeTransferHistoryStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        transfers: {},
        getTransfer: (id: string | null) => {
          if (id) return get().transfers[id];
        },
        addTransfer: (transfer: BridgeTransfer) => {
          set(state => {
            state.transfers[transfer.id] = transfer;
          });
        },
        updateSourceTransaction: (id: string, { rawTx }) => {
          const transfer = get().transfers[id];
          if (!transfer) return;

          const newSourceTransactionStatus = xCallServiceActions
            .getXCallService(transfer.sourceChainId)
            .deriveTxStatus(rawTx);

          const newSourceTransaction = {
            ...transfer.sourceTransaction,
            rawTx,
            status: newSourceTransactionStatus,
          };
          const newStatus = deriveStatus(newSourceTransaction, transfer.events, transfer.destinationTransaction);

          set(state => {
            state.transfers[id] = {
              ...transfer,
              sourceTransaction: newSourceTransaction,
              status: newStatus,
            };
          });
        },
        updateTransferEvents: async (id: string, events: XCallEventMap) => {
          const transfer = get().transfers[id];
          if (!transfer) return;

          let destinationTransaction: Transaction | undefined = undefined;

          const newEvents = {
            ...transfer.events,
            ...events,
          };

          if (newEvents[XCallEventType.CallExecuted]) {
            const dstXCallService = xCallServiceActions.getXCallService(transfer.destinationChainId);
            const destinationTransactionHash = newEvents[XCallEventType.CallExecuted].txHash;
            const tx = await dstXCallService.getTxReceipt(destinationTransactionHash);

            destinationTransaction = {
              id: destinationTransactionHash,
              hash: destinationTransactionHash,
              xChainId: transfer.destinationChainId,
              status: dstXCallService.deriveTxStatus(tx),
              rawTx: tx,
            };
          }
          const newStatus = deriveStatus(transfer.sourceTransaction, newEvents, destinationTransaction);

          set(state => {
            state.transfers[id] = {
              ...transfer,
              events: newEvents,
              status: newStatus,
              destinationTransaction,
            };
          });
        },
        remove: (id: string) => {
          set(state => {
            delete state.transfers[id];
          });
        },
      })),
      {
        name: 'bridge-transfer-history-store',
        storage,
      },
    ),
    { name: 'BridgeTransferHistoryStore' },
  ),
);

export const bridgeTransferHistoryActions = {
  get: (id: string | null) => {
    return useBridgeTransferHistoryStore.getState().getTransfer(id);
  },

  add: (transfer: BridgeTransfer) => {
    useBridgeTransferHistoryStore.getState().addTransfer(transfer);
  },

  updateSourceTransaction: (id: string, { rawTx }) => {
    useBridgeTransferHistoryStore.getState().updateSourceTransaction(id, { rawTx });
  },
  updateTransferEvents: async (id: string, events: XCallEventMap) => {
    await useBridgeTransferHistoryStore.getState().updateTransferEvents(id, events);
  },

  remove: (id: string) => {
    useBridgeTransferHistoryStore.getState().remove(id);
  },
};

export const useFetchBridgeTransferEvents = (transfer?: BridgeTransfer) => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['bridge-transfer-events', transfer?.id],
    queryFn: async () => {
      console.log('transfer', transfer);
      if (!transfer) {
        return null;
      }

      const { sourceChainId, destinationChainId, sourceTransaction } = transfer;

      let events: XCallEventMap = {};
      if (transfer.status === BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT) {
        const srcChainXCallService = xCallServiceActions.getXCallService(sourceChainId);
        events = await srcChainXCallService.getSourceEvents(sourceTransaction);
      } else if (
        transfer.status === BridgeTransferStatus.CALL_MESSAGE_SENT ||
        transfer.status === BridgeTransferStatus.CALL_MESSAGE
        // || transfer.status === BridgeTransferStatus.CALL_EXECUTED
      ) {
        const callMessageSentEvent = transfer.events[XCallEventType.CallMessageSent];
        if (callMessageSentEvent) {
          events = xCallEventActions.getDestinationEvents(destinationChainId, callMessageSentEvent.sn);
        }
      }

      return events;
    },
    refetchInterval: 2000,
    enabled:
      !!transfer?.id &&
      transfer?.status !== BridgeTransferStatus.CALL_EXECUTED &&
      transfer?.status !== BridgeTransferStatus.TRANSFER_FAILED,
  });

  return {
    events,
    isLoading,
  };
};
