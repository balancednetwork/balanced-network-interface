import { create } from 'zustand';
import { BridgeTransfer, BridgeTransferStatus, Transaction, TransactionStatus, XCallEventMap } from './types';
import { xCallServiceActions } from './useXCallServiceStore';
import { XCallEventType } from '../types';

type BridgeTransferHistoryStore = {
  transfers: BridgeTransfer[];
};

//TODO: persist this store
export const useBridgeTransferHistoryStore = create<BridgeTransferHistoryStore>()(set => ({
  transfers: [],
}));

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
