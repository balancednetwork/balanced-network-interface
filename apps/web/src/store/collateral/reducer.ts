import { createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { CurrencyKey, IcxDisplayType } from 'types';

export enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

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

const collateralSlice = createSlice({
  name: 'collateral',
  initialState,
  reducers: create => ({
    adjust: create.reducer<void>(state => {
      state.state.isAdjusting = true;
    }),
    cancel: create.reducer<void>(state => {
      state.state.isAdjusting = false;
    }),
    type: create.reducer<{ independentField: Field; typedValue: string; inputType: 'slider' | 'text' }>(
      (state, { payload: { independentField, typedValue, inputType } }) => {
        state.state.independentField = independentField || state.state.independentField;
        state.state.typedValue = typedValue ?? state.state.typedValue;
        state.state.inputType = inputType || state.state.inputType;
      },
    ),
    changeDepositedAmount: create.reducer<{ depositedAmount: BigNumber; token: string }>(
      (state, { payload: { depositedAmount, token } }) => {
        state.depositedAmounts[token] = depositedAmount;
      },
    ),
    changeCollateralType: create.reducer<{ collateralType: CurrencyKey }>((state, { payload: { collateralType } }) => {
      state.collateralType = collateralType;
    }),
    changeIcxDisplayType: create.reducer<{ icxDisplayType: IcxDisplayType }>(
      (state, { payload: { icxDisplayType } }) => {
        state.icxDisplayType = icxDisplayType;
      },
    ),
  }),
});

export const { changeDepositedAmount, changeCollateralType, changeIcxDisplayType, adjust, cancel, type } =
  collateralSlice.actions;

export default collateralSlice.reducer;
