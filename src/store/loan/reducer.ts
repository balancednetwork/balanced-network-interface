import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import {
  changeAvailableValue,
  changeBorrowedValue,
  changebnUSDbadDebt,
  changebnUSDtotalSupply,
  adjust,
  cancel,
  type,
  Field,
} from './actions';

export interface LoanState {
  borrowedValue: BigNumber;
  availabelValue: BigNumber;
  bnUSDbadDebt: BigNumber;
  bnUSDtotalSupply: BigNumber;

  // loan panel UI state
  state: {
    isAdjusting: boolean;
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
  };
}

const initialState: LoanState = {
  borrowedValue: new BigNumber(0),
  availabelValue: new BigNumber(0),
  bnUSDbadDebt: new BigNumber(0),
  bnUSDtotalSupply: new BigNumber(0),

  // loan panel UI state
  state: {
    isAdjusting: false,
    typedValue: '',
    independentField: Field.LEFT,
    inputType: 'text',
  },
};

export default createReducer(initialState, builder =>
  builder
    .addCase(adjust, (state, { payload }) => {
      state.state.isAdjusting = true;
    })
    .addCase(cancel, (state, { payload }) => {
      // reset typedValue, indepentField, isAdjusting values
      state.state.isAdjusting = false;
    })
    .addCase(type, (state, { payload: { independentField, typedValue, inputType } }) => {
      state.state.independentField = independentField || state.state.independentField;
      state.state.typedValue = typedValue || state.state.independentField;
      state.state.inputType = inputType || state.state.inputType;
    })
    .addCase(changeBorrowedValue, (state, { payload: { borrowedValue } }) => {
      state.borrowedValue = borrowedValue;
    })
    .addCase(changeAvailableValue, (state, { payload: { availabelValue } }) => {
      state.availabelValue = availabelValue;
    })
    .addCase(changebnUSDbadDebt, (state, { payload: { bnUSDbadDebt } }) => {
      state.bnUSDbadDebt = bnUSDbadDebt;
    })
    .addCase(changebnUSDtotalSupply, (state, { payload: { bnUSDtotalSupply } }) => {
      state.bnUSDtotalSupply = bnUSDtotalSupply;
    }),
);
