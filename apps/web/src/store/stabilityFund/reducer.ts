import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

export interface StabilityFundState {
  balances: { [key: string]: CurrencyAmount<Token> };
}

const initialState: StabilityFundState = {
  balances: {},
};

const stabilityFundSlice = createSlice({
  name: 'stabilityFund',
  initialState,
  reducers: create => ({
    setBalances: create.reducer<{ balances: { [key: string]: CurrencyAmount<Token> } }>(
      (state, { payload: { balances } }) => {
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
      },
    ),
  }),
});

export const { setBalances } = stabilityFundSlice.actions;

export default stabilityFundSlice.reducer;
