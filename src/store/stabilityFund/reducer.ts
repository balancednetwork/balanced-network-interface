import { createReducer } from '@reduxjs/toolkit';

import { CurrencyAmount, Token } from 'types/balanced-sdk-core';

import { setBalances } from './actions';

export interface StabilityFundState {
  balances: { [key: string]: CurrencyAmount<Token> };
}

const initialState: StabilityFundState = {
  balances: {},
};

export default createReducer(initialState, builder =>
  builder.addCase(setBalances, (state, { payload: { balances } }) => {
    state.balances = balances || state.balances;
  }),
);
