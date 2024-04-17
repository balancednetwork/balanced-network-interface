import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { changeOraclePrice } from './actions';

export interface OracleState {
  prices: {
    [key in string]: BigNumber;
  };
}

const initialState: OracleState = {
  prices: {},
};

export default createReducer(initialState, builder =>
  builder.addCase(changeOraclePrice, (state, { payload: { symbol, price } }) => {
    const updatedPrices = { ...state.prices };
    updatedPrices[symbol] = price;
    state.prices = updatedPrices;
  }),
);
