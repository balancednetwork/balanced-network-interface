// @ts-nocheck
import { create } from 'zustand';

export const useBridgeTransferHistoryStore = create(set => ({
  transfers: [],
}));

export const bridgeTransferHistoryActions = {
  addTransfer: transfer => {
    bridgeTransferHistoryStore.setState(state => ({
      transfers: [transfer, ...state.transfers],
    }));
  },
};
