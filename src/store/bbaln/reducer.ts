import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { LockedPeriod } from 'app/components/home/BBaln/types';

import { Field } from '../loan/actions';
import { adjust, cancel, type, changeData } from './actions';

export interface BBalnState {
  bbalnAmount: BigNumber;
  lockedBaln: undefined | CurrencyAmount<Token>;
  lockedUntil: Date | undefined;
  lockedPeriod: LockedPeriod | undefined;

  state: {
    isAdjusting: boolean;
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
  };
}

const initialState: BBalnState = {
  bbalnAmount: new BigNumber(0),
  lockedBaln: undefined,
  lockedUntil: undefined,
  lockedPeriod: undefined,

  state: {
    isAdjusting: false,
    typedValue: '',
    independentField: Field.LEFT,
    inputType: 'text',
  },
};

export default createReducer(initialState, builder =>
  builder
    .addCase(changeData, (state, { payload }) => {
      state.bbalnAmount = payload.bbalnAmount;
      if (!state.lockedBaln?.equalTo(payload.lockedBaln)) {
        state.lockedBaln = payload.lockedBaln;
      }
      if (state.lockedUntil?.getTime() !== payload.lockEnd.getTime()) {
        state.lockedUntil = payload.lockEnd;
      }
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
