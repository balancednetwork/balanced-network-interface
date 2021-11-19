import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { CURRENCY } from 'constants/currency';
import { ZERO } from 'constants/index';

import { changeBalances, resetBalances } from './actions';

export interface WalletState {
  [key: string]: BigNumber;
}

const initialState: WalletState = CURRENCY.reduce((p, c) => {
  p[c] = ZERO;
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
