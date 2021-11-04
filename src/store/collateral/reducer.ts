import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { IcxDisplayType } from 'types';

import { changeDepositedAmount, changeIcxDisplayType, adjust, cancel, type, Field } from './actions';

export interface CollateralState {
  depositedAmount: BigNumber;
  icxDisplayType: IcxDisplayType;

  // collateral panel UI state
  state: {
    isAdjusting: boolean;
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
  };
}

const initialState: CollateralState = {
  depositedAmount: new BigNumber(0),
  icxDisplayType: 'ICX',

  // collateral panel UI state
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
    .addCase(changeDepositedAmount, (state, { payload: { depositedAmount } }) => {
      state.depositedAmount = depositedAmount;
    })
    .addCase(changeIcxDisplayType, (state, { payload: { icxDisplayType } }) => {
      state.icxDisplayType = icxDisplayType;
    }),
);
