import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { CurrencyKey, IcxDisplayType } from 'types';

import {
  changeDepositedAmount,
  changeCollateralType,
  changeIcxDisplayType,
  adjust,
  cancel,
  type,
  Field,
} from './actions';

export interface CollateralState {
  depositedAmount: BigNumber;
  collateralType: CurrencyKey;
  icxDisplayType: IcxDisplayType;
  depositedAmounts: { [key in string]: BigNumber };

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
  collateralType: 'sICX',
  icxDisplayType: 'ICX',
  depositedAmounts: {},
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
    .addCase(changeDepositedAmount, (state, { payload: { depositedAmount, token } }) => {
      const updatedAmounts = { ...state.depositedAmounts };
      updatedAmounts[token] = depositedAmount;
      state.depositedAmounts = updatedAmounts;
    })
    .addCase(changeCollateralType, (state, { payload: { collateralType } }) => {
      state.collateralType = collateralType;
    })
    .addCase(changeIcxDisplayType, (state, { payload: { icxDisplayType } }) => {
      state.icxDisplayType = icxDisplayType;
    }),
);
