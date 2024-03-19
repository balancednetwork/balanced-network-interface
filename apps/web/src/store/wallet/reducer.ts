import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';

import { ARCHWAY_SUPPORTED_TOKENS_LIST } from 'app/_xcall/archway/tokens';
import { SupportedXCallChains } from 'app/_xcall/types';
import { ZERO } from 'constants/index';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';

import { changeICONBalances, changeArchwayBalances, resetBalances } from './actions';

export type WalletState = {
  [key in SupportedXCallChains]: { [address: string]: CurrencyAmount<Currency> };
};

const initialState: WalletState = {
  icon: SUPPORTED_TOKENS_LIST.reduce((p, t) => {
    p[t?.symbol!] = ZERO;
    return p;
  }, {}),
  archway: ARCHWAY_SUPPORTED_TOKENS_LIST.reduce((p, t) => {
    p[t?.symbol!] = ZERO;
    return p;
  }, {}),
};

export default createReducer(initialState, builder =>
  builder
    .addCase(changeICONBalances, (state, { payload }) => {
      state.icon = payload;
    })
    .addCase(changeArchwayBalances, (state, { payload }) => {
      state.archway = payload;
    })
    .addCase(resetBalances, state => {
      return initialState;
    }),
);
