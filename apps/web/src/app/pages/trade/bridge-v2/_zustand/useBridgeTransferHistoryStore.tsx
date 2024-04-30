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

/*
transferId: string;
sourceChain: string;
destinationChain: string;
sourceAddress: string;
destinationAddress: string;

transferToken: string;
transferAmount: string;

status: 'pending' | 'completed' | 'failed';
events: any[];
*/
