import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import {
  changeBorrowedAmount,
  changeBadDebt,
  changeTotalSupply,
  adjust,
  cancel,
  type,
  Field,
  setLockingRatio,
} from './actions';

export interface LoanState {
  badDebt: BigNumber;
  totalSupply: BigNumber;
  totalRepaid: BigNumber;
  totalCollateralSold: BigNumber;
  borrowedAmounts: {
    [key in string]: BigNumber;
  };
  lockingRatios: {
    [key in string]: number;
  };

  // loan panel UI state
  state: {
    isAdjusting: boolean;
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
  };
}

const initialState: LoanState = {
  badDebt: new BigNumber(0),
  totalSupply: new BigNumber(0),
  totalRepaid: new BigNumber(0),
  totalCollateralSold: new BigNumber(0),
  borrowedAmounts: {},
  lockingRatios: {},

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
    .addCase(changeBorrowedAmount, (state, { payload: { borrowedAmount, collateralType } }) => {
      const updatedAmounts = { ...state.borrowedAmounts };
      updatedAmounts[collateralType] = borrowedAmount;
      state.borrowedAmounts = updatedAmounts;
    })
    .addCase(changeBadDebt, (state, { payload: { badDebt } }) => {
      state.badDebt = badDebt;
    })
    .addCase(changeTotalSupply, (state, { payload: { totalSupply } }) => {
      state.totalSupply = totalSupply;
    })
    .addCase(setLockingRatio, (state, { payload: { lockingRatio, collateralType } }) => {
      const updatedRatios = { ...state.lockingRatios };
      updatedRatios[collateralType] = lockingRatio;
      state.lockingRatios = updatedRatios;
    }),
);
