import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';

import { setBalances } from './actions';

export interface StabilityFundState {
  balances: { [key: string]: CurrencyAmount<Token> };
}

const initialState: StabilityFundState = {
  balances: {},
};

export default createReducer(initialState, builder =>
  builder.addCase(setBalances, (state, { payload: { balances } }) => {
    if (Object.keys(state.balances).length === 0) {
      if (balances) {
        state.balances = balances;
      }
    } else if (balances) {
      const isBalanceEqual =
        Object.keys(state.balances).length === Object.keys(balances).length
          ? Object.keys(state.balances).every(key => {
              return state.balances[key].equalTo(balances[key]);
            })
          : false;

      if (!isBalanceEqual) {
        state.balances = balances;
      }
    }
  }),
);
