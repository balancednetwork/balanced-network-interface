import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

export interface FeesState {
  fees: { [key: string]: CurrencyAmount<Token> };
}

const initialState: FeesState = {
  fees: {},
};

const feesSlice = createSlice({
  name: 'fees',
  initialState,
  reducers: create => ({
    setFees: create.reducer<{ fees: { [key: string]: CurrencyAmount<Token> } }>((state, { payload: { fees } }) => {
      state.fees = fees || state.fees;
    }),
  }),
});

export const { setFees } = feesSlice.actions;

export default feesSlice.reducer;
