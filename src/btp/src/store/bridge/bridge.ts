import { createSlice } from '@reduxjs/toolkit';

import { BTPAppState } from '..';

export interface BridgeState {
  symbol: string;
  wallet: string;
  address: string;
  balance: number;
  cancelConfirmation: boolean;
  currentNetwork: string;
  fromNetwork: any;
  nextFromNetwork: any;
  toNetwork: any;
}

const initialState: BridgeState = {
  symbol: '',
  wallet: '',
  address: '',
  balance: 0,
  cancelConfirmation: false,
  currentNetwork: '',
  fromNetwork: '',
  nextFromNetwork: '',
  toNetwork: '',
};

const bridge = createSlice({
  name: 'account',
  initialState: initialState,
  reducers: {
    setFromNetwork(state, { payload }: { payload: any }) {
      state.fromNetwork = payload;
    },
    setToNetwork(state, { payload }: { payload: any }) {
      state.toNetwork = payload;
    },
    setNextFromNetwork(state, { payload }: { payload: any }) {
      state.nextFromNetwork = payload;
    },
  },
});

export const { setToNetwork, setFromNetwork, setNextFromNetwork } = bridge.actions;

export const brideSelector = (state: BTPAppState) => state.bridge;

export default bridge.reducer;
