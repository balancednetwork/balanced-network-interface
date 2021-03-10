import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { changeDeposite, changeBalance } from './actions';

export interface CollateralState {
  depositedValue: BigNumber;
  balance: BigNumber;
}

const initialState: CollateralState = {
  depositedValue: new BigNumber(0),
  balance: new BigNumber(0),
};

export default createReducer(initialState, builder =>
  builder
    .addCase(changeDeposite, (state, { payload: { depositedValue } }) => {
      state.depositedValue = depositedValue;
    })
    .addCase(changeBalance, (state, { payload: { balance } }) => {
      state.balance = balance;
    }),
);
