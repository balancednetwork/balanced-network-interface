import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

import { Field } from '../loan/reducer';

export interface SavingsState {
  lockedAmount: CurrencyAmount<Token> | undefined;

  state: {
    isAdjusting: boolean;
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
  };
}

const initialState: SavingsState = {
  lockedAmount: undefined,

  state: {
    isAdjusting: false,
    typedValue: '',
    independentField: Field.LEFT,
    inputType: 'text',
  },
};

const savingsSlice = createSlice({
  name: 'savings',
  initialState,
  reducers: create => ({
    changeLockedAmount: create.reducer<{ lockedAmount: CurrencyAmount<Token> | undefined }>(
      (state, { payload: { lockedAmount } }) => {
        state.lockedAmount = lockedAmount;
      },
    ),
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
  }),
});

export const { adjust, cancel, type, changeLockedAmount } = savingsSlice.actions;

export default savingsSlice.reducer;
