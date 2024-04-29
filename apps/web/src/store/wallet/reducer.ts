import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';

import { XChainId } from 'app/_xcall/types';
import { ZERO } from 'constants/index';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';

import { changeICONBalances, changeArchwayBalances, resetBalances } from './actions';

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

export default createReducer(initialState, builder =>
  builder
    .addCase(changeICONBalances, (state, { payload }) => {
      state['0x1.icon'] = payload;
    })
    .addCase(changeArchwayBalances, (state, { payload }) => {
      state['archway-1'] = payload;
    })
    .addCase(resetBalances, state => {
      return initialState;
    }),
);
