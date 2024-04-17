import { createSlice } from '@reduxjs/toolkit';

import { ADDRESS_LOCAL_STORAGE, CONNECTED_WALLET_LOCAL_STORAGE } from '../../connectors/constants';
import { BTPAppState } from '../index';

export type AccountState = {
  symbol?: string;
  wallet?: any;
  address?: string;
  balance?: number | string;
  cancelConfirmation?: boolean;
  currentNetwork?: string;
  id?: string;
};

export const accountInitial: { accountInfo: AccountState | null } = {
  accountInfo: null,
};

const account = createSlice({
  name: 'account',
  initialState: accountInitial,
  reducers: {
    setAccountInfo(state, { payload }: { payload: AccountState | null }) {
      if (payload === null) {
        state.accountInfo = null;
      } else {
        state.accountInfo = {
          ...state.accountInfo,
          ...payload,
        };
      }
    },
    resetAccountInfo(state) {
      localStorage.removeItem(ADDRESS_LOCAL_STORAGE);
      localStorage.removeItem(CONNECTED_WALLET_LOCAL_STORAGE);
      state = accountInitial;
    },
  },
});

export const { setAccountInfo, resetAccountInfo } = account.actions;

export const accountSelector = (state: BTPAppState) => state.account;

export default account.reducer;
