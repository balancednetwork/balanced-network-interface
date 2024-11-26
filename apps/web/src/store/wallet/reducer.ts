import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

import { XChainId, XToken } from '@/xwagmi/types';

export type WalletState = {
  [key in XChainId]?: { [address: string]: CurrencyAmount<XToken> };
};

const initialState: WalletState = {};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: create => ({
    changeBalances: create.reducer<{ xChainId: XChainId; balances: { [key: string]: CurrencyAmount<XToken> } }>(
      (state, { payload }) => {
        state[payload.xChainId] = payload.balances;
      },
    ),
    resetBalances: create.reducer<void>(state => {
      return initialState;
    }),
  }),
});

export const { resetBalances, changeBalances } = walletSlice.actions;

export default walletSlice.reducer;
