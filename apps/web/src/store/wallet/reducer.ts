import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

import { XChainId } from 'app/_xcall/types';
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

    changeArchwayBalances: create.reducer<{ [key: string]: CurrencyAmount<Currency> }>((state, { payload }) => {
      state['archway-1'] = payload;
    }),

    resetBalances: create.reducer<void>(state => {
      return initialState;
    }),
  }),
});

export const { changeICONBalances, changeArchwayBalances, resetBalances } = walletSlice.actions;

export default walletSlice.reducer;
