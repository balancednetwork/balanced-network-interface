import { createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export interface OracleState {
  prices: {
    [key in string]: BigNumber;
  };
}

const initialState: OracleState = {
  prices: {},
};

const oracleSlice = createSlice({
  name: 'oracle',
  initialState,
  reducers: create => ({
    changeOraclePrice: create.reducer<{ symbol: string; price: BigNumber }>((state, { payload: { symbol, price } }) => {
      state.prices[symbol] = price;
    }),
  }),
});

export const { changeOraclePrice } = oracleSlice.actions;

export default oracleSlice.reducer;
