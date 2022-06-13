import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';

import { ZERO } from 'constants/index';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';

import { changeBalances, resetBalances } from './actions';

export interface WalletState {
  [address: string]: CurrencyAmount<Currency>;
}

const initialState: WalletState = SUPPORTED_TOKENS_LIST.reduce((p, t) => {
  p[t?.symbol!] = ZERO;
  return p;
}, {});

export default createReducer(initialState, builder =>
  builder
    .addCase(changeBalances, (state, { payload }) => {
      return payload;
    })
    .addCase(resetBalances, state => {
      return initialState;
    }),
);
