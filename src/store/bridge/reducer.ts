import { createReducer } from '@reduxjs/toolkit';
import { ADDRESS_LOCAL_STORAGE, CONNECTED_WALLET_LOCAL_STORAGE } from 'btp/src/connectors/constants';

import { resetAccount, setFromNetwork, setToNetwork } from './actions';

export interface BridgeState {
  symbol: string;
  wallet: string;
  address: string;
  balance: number;
  cancelConfirmation: boolean;
  currentNetwork: string;
  fromNetwork: any;
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
  toNetwork: '',
};

export default createReducer(initialState, builder =>
  builder
    .addCase(resetAccount, () => {
      localStorage.removeItem(ADDRESS_LOCAL_STORAGE);
      localStorage.removeItem(CONNECTED_WALLET_LOCAL_STORAGE);
      return initialState;
    })
    .addCase(setFromNetwork, (state, { payload: { network } }) => {
      state.fromNetwork = network;
    })
    .addCase(setToNetwork, (state, { payload: { network } }) => {
      state.toNetwork = network;
    }),
);
