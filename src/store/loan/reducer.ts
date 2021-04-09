import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import {
  changeBorrowedAmount,
  changeBadDebt,
  changeTotalSupply,
  changeTotalRepaid,
  adjust,
  cancel,
  type,
  Field,
} from './actions';

export interface LoanState {
  borrowedAmount: BigNumber;
  badDebt: BigNumber;
  totalSupply: BigNumber;
  totalRepaid: BigNumber;

  // loan panel UI state
  state: {
    isAdjusting: boolean;
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
  };
}

const initialState: LoanState = {
  borrowedAmount: new BigNumber(0),
  badDebt: new BigNumber(0),
  totalSupply: new BigNumber(0),
  totalRepaid: new BigNumber(0),

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
      // reset typedValue, independentField, isAdjusting values
      state.state.isAdjusting = false;
    })
    .addCase(type, (state, { payload: { independentField, typedValue, inputType } }) => {
      state.state.independentField = independentField || state.state.independentField;
      state.state.typedValue = typedValue ?? state.state.typedValue;
      state.state.inputType = inputType || state.state.inputType;
    })
    .addCase(changeBorrowedAmount, (state, { payload: { borrowedAmount } }) => {
      state.borrowedAmount = borrowedAmount;
    })
    .addCase(changeBadDebt, (state, { payload: { badDebt } }) => {
      state.badDebt = badDebt;
    })
    .addCase(changeTotalSupply, (state, { payload: { totalSupply } }) => {
      state.totalSupply = totalSupply;
    })
    .addCase(changeTotalRepaid, (state, { payload: { totalRepaid } }) => {
      state.totalRepaid = totalRepaid;
    }),
);
