import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';

import { setFees } from './actions';

export interface FeesState {
  fees: { [key: string]: CurrencyAmount<Token> };
}

const initialState: FeesState = {
  fees: {},
};

export default createReducer(initialState, builder =>
  builder.addCase(setFees, (state, { payload: { fees } }) => {
    state.fees = fees || state.fees;
  }),
);
