import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

import { useQuery } from '@tanstack/react-query';

import { XCallEventType } from '../types';
import { BridgeTransfer, BridgeTransferStatus, Transaction, TransactionStatus, XCallEventMap } from './types';
import { xCallServiceActions } from './useXCallServiceStore';
import { xCallEventActions } from './useXCallEventStore';
import { CurrencyAmount } from '@balancednetwork/sdk-core';

type BridgeTransferHistoryStore = {
  transfers: BridgeTransfer[];
};

const storage = createJSONStorage(() => sessionStorage, {
  reviver: (key, value: any) => {
    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substr(8));
    }
    if (value && value.type === 'CurrencyAmount') {
      return 'currencyamount::' + value.currencyAddress;
    }
    return value;
  },
  replacer: (key, value) => {
    if (typeof value === 'bigint') {
      return `BIGINT::${value}`;
    } else if (value instanceof CurrencyAmount) {
      return { type: 'CurrencyAmount', currencyAddress: value.currency.address };
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
export const deriveStatus = (sourceTransaction: Transaction, events: XCallEventMap): BridgeTransferStatus => {
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
    if (!events[XCallEventType.CallMessageSent]) {
      return BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT;
    }

    if (!events[XCallEventType.CallMessage]) {
      return BridgeTransferStatus.CALL_MESSAGE_SENT;
    }

    if (!events[XCallEventType.CallExecuted]) {
      return BridgeTransferStatus.CALL_MESSAGE;
    } else {
      return BridgeTransferStatus.CALL_EXECUTED;
    }
  }

  return BridgeTransferStatus.TRANSFER_FAILED;
};

export const bridgeTransferHistoryActions = {
  get: id => {
    if (id) {
      return useBridgeTransferHistoryStore.getState().transfers.find(transfer => transfer.id === id);
    }
  },

  add: (transfer: BridgeTransfer) => {
    useBridgeTransferHistoryStore.setState(state => ({
      transfers: [transfer, ...state.transfers],
    }));
  },
  updateSourceTransaction: (id: string, { rawTx }) => {
    useBridgeTransferHistoryStore.setState(state => {
      const transfer = state.transfers.find(transfer => transfer.id === id);
      if (!transfer) return state;

      const newSourceTransactionStatus = xCallServiceActions
        .getXCallService(transfer.bridgeInfo.bridgeDirection.from)
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
  updateTransferEvents: (id: string, events: XCallEventMap) => {
    useBridgeTransferHistoryStore.setState(state => {
      const transfer = state.transfers.find(transfer => transfer.id === id);
      if (!transfer) return state;

      const newEvents = {
        ...transfer.events,
        ...events,
      };

      const newStatus = deriveStatus(transfer.sourceTransaction, newEvents);

      return {
        ...state,
        transfers: state.transfers.map(transfer => {
          if (transfer.id === id) {
            return {
              ...transfer,
              events: newEvents,
              status: newStatus,
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

export const useFetchBridgeTransferEvents = transfer => {
  const { data: events, isLoading } = useQuery({
    queryKey: ['bridge-transfer-events', transfer?.id],
    queryFn: async () => {
      console.log('transfer', transfer);
      if (!transfer) {
        return null;
      }

      const {
        bridgeInfo: { bridgeDirection },
      } = transfer;

      let events: XCallEventMap = {};
      if (transfer.status === BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT) {
        const srcChainXCallService = xCallServiceActions.getXCallService(bridgeDirection.from);
        events = await srcChainXCallService.fetchSourceEvents(transfer);
      } else if (
        transfer.status === BridgeTransferStatus.CALL_MESSAGE_SENT ||
        transfer.status === BridgeTransferStatus.CALL_MESSAGE
        // || transfer.status === BridgeTransferStatus.CALL_EXECUTED
      ) {
        console.log('transfer.status !== BridgeTransferStatus.AWAITING_CALL_MESSAGE_SENT', transfer.events);
        const callMessageSentEvent = transfer.events[XCallEventType.CallMessageSent];
        console.log('callMessageSentEvent', callMessageSentEvent);
        if (callMessageSentEvent) {
          console.log('callMessageSentEvent', callMessageSentEvent);
          events = xCallEventActions.getDestinationEvents(bridgeDirection.to, callMessageSentEvent.sn);
          console.log('events', events);
        }
      }

      return events;
    },
    refetchInterval: 2000,
    enabled:
      !!transfer?.id &&
      transfer.status !== BridgeTransferStatus.CALL_EXECUTED &&
      transfer.status !== BridgeTransferStatus.TRANSFER_FAILED,
  });

  return {
    events,
    isLoading,
  };
};
