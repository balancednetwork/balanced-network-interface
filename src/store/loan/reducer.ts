import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { changeAvailabelValue, changeBorrowedValue, changebnUSDbadDebt, changebnUSDtotalSupply } from './actions';

export interface LoanState {
  borrowedValue: BigNumber;
  availabelValue: BigNumber;
  bnUSDbadDebt: BigNumber;
  bnUSDtotalSupply: BigNumber;
}

const initialState: LoanState = {
  borrowedValue: new BigNumber(0),
  availabelValue: new BigNumber(0),
  bnUSDbadDebt: new BigNumber(0),
  bnUSDtotalSupply: new BigNumber(0),
};

export default createReducer(initialState, builder =>
  builder
    .addCase(changeBorrowedValue, (state, { payload: { borrowedValue } }) => {
      state.borrowedValue = borrowedValue;
    })
    .addCase(changeAvailabelValue, (state, { payload: { availabelValue } }) => {
      state.availabelValue = availabelValue;
    })
    .addCase(changebnUSDbadDebt, (state, { payload: { bnUSDbadDebt } }) => {
      state.bnUSDbadDebt = bnUSDbadDebt;
    })
    .addCase(changebnUSDtotalSupply, (state, { payload: { bnUSDtotalSupply } }) => {
      state.bnUSDtotalSupply = bnUSDtotalSupply;
    }),
);
