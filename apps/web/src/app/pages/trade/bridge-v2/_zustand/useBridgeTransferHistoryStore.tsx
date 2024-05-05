import { create } from 'zustand';
import { BridgeTransfer, XCallEventMap } from './types';
import { deriveStatus } from './useBridgeTransferStore';
import { xCallServiceActions } from './useXCallServiceStore';

type BridgeTransferHistoryStore = {
  transfers: BridgeTransfer[];
};

//TODO: persist this store
export const useBridgeTransferHistoryStore = create<BridgeTransferHistoryStore>()(set => ({
  transfers: [],
}));

export const bridgeTransferHistoryActions = {
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
