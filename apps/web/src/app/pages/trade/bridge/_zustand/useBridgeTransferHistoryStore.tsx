import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { useQuery } from '@tanstack/react-query';
import { CurrencyAmount } from '@balancednetwork/sdk-core';

import { XCallEventType } from '../types';
import { BridgeTransfer, BridgeTransferStatus, Transaction, TransactionStatus, XCallEventMap } from './types';
import { xCallServiceActions } from './useXCallServiceStore';
import { xCallEventActions } from './useXCallEventStore';

type BridgeTransferHistoryStore = {
  transfers: BridgeTransfer[];
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

//TODO: persist this store
export const useBridgeTransferHistoryStore = create<BridgeTransferHistoryStore>()(
  persist(
    set => ({
      transfers: [],
    }),
    {
      name: 'bridge-transfer-history-store',
      storage,
    },
  ),
);

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

export const bridgeTransferHistoryActions = {
  get: (id: string | null) => {
    if (id) {
      return useBridgeTransferHistoryStore.getState().transfers.find(transfer => transfer.id === id);
    }
  },

  add: (transfer: BridgeTransfer) => {
    // TODO: check if transfer already exists
    useBridgeTransferHistoryStore.setState(state => ({
      transfers: [transfer, ...state.transfers],
    }));
  },

  updateSourceTransaction: (id: string, { rawTx }) => {
    useBridgeTransferHistoryStore.setState(state => {
      const transfer = state.transfers.find(transfer => transfer.id === id);
      if (!transfer) return state;

      const newSourceTransactionStatus = xCallServiceActions
        .getXCallService(transfer.sourceChainId)
        .deriveTxStatus(rawTx);

      const newSourceTransaction = {
        ...transfer.sourceTransaction,
        rawTx,
        status: newSourceTransactionStatus,
      };
      const newStatus = deriveStatus(newSourceTransaction, transfer.events);

      return {
        ...state,
        transfers: state.transfers.map(transfer => {
          if (transfer.id === id) {
            return {
              ...transfer,
              sourceTransaction: newSourceTransaction,
              status: newStatus,
            };
          }
          return transfer;
        }),
      };
    });
  },
  updateTransferEvents: async (id: string, events: XCallEventMap) => {
    const transfer = useBridgeTransferHistoryStore.getState().transfers.find(transfer => transfer.id === id);
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

    useBridgeTransferHistoryStore.setState(state => {
      // const transfer = state.transfers.find(transfer => transfer.id === id);
      // if (!transfer) return state;

      // const newEvents = {
      //   ...transfer.events,
      //   ...events,
      // };

      const newStatus = deriveStatus(transfer.sourceTransaction, newEvents, destinationTransaction);

      return {
        ...state,
        transfers: state.transfers.map(transfer => {
          if (transfer.id === id) {
            return {
              ...transfer,
              events: newEvents,
              status: newStatus,
              destinationTransaction,
            };
          }
          return transfer;
        }),
      };
    });
  },

  remove: (id: string) => {
    useBridgeTransferHistoryStore.setState(state => ({
      transfers: state.transfers.filter(transfer => transfer.id !== id),
    }));
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
