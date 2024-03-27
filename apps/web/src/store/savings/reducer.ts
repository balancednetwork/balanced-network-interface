import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';

import { Field } from '../loan/actions';
import { adjust, cancel, type, changeLockedAmount } from './actions';

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

export default createReducer(initialState, builder =>
  builder
    .addCase(changeLockedAmount, (state, { payload }) => {
      state.lockedAmount = payload.lockedAmount;
    })
    .addCase(adjust, (state, { payload }) => {
      state.state.isAdjusting = true;
    })
    .addCase(cancel, (state, { payload }) => {
      state.state.isAdjusting = false;
    })
    .addCase(type, (state, { payload: { independentField, typedValue, inputType } }) => {
      state.state.independentField = independentField || state.state.independentField;
      state.state.typedValue = typedValue ?? state.state.typedValue;
      state.state.inputType = inputType || state.state.inputType;
    }),
);
