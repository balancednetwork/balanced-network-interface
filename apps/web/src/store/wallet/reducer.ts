import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

import { XChainId } from 'app/pages/trade/bridge/types';
import { ZERO } from 'constants/index';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';

export type WalletState = {
  [key in XChainId]?: { [address: string]: CurrencyAmount<Currency> };
};

const initialState: WalletState = {
  '0x1.icon': SUPPORTED_TOKENS_LIST.reduce((p, t) => {
    p[t?.symbol!] = ZERO;
    return p;
  }, {}),
  'archway-1': {},
};

const walletSlice = createSlice({
  name: 'wallet',
  initialState,
  reducers: create => ({
    changeICONBalances: create.reducer<{ [key: string]: CurrencyAmount<Currency> }>((state, { payload }) => {
      state['0x1.icon'] = payload;
    }),

    changeBalances: create.reducer<{ xChainId: XChainId; balances: { [key: string]: CurrencyAmount<Currency> } }>(
      (state, { payload }) => {
        state[payload.xChainId] = payload.balances;
      },
    ),
    resetBalances: create.reducer<void>(state => {
      return initialState;
    }),
  }),
});

export const { changeICONBalances, resetBalances, changeBalances } = walletSlice.actions;

export default walletSlice.reducer;
