import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { LockedPeriod } from 'app/components/home/BBaln/types';

import { Field } from '../loan/actions';
import { adjust, cancel, type, setBoost } from './actions';

export interface BBalnState {
  bbalnAmount: BigNumber;
  lockedBaln: BigNumber;
  lockedUntil: Date | undefined;
  lockedOn: Date | undefined;
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
  lockedBaln: new BigNumber(0),
  lockedUntil: undefined,
  lockedOn: undefined,
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
    })
    .addCase(setBoost, (state, { payload: { bbalnAmount, lockedBaln, lockedUntil, lockedOn, lockedPeriod } }) => {
      state.state.isAdjusting = false;
      state.bbalnAmount = bbalnAmount ? bbalnAmount : state.bbalnAmount;
      state.lockedBaln = lockedBaln ? lockedBaln : state.lockedBaln;
      state.lockedUntil = lockedUntil ? lockedUntil : state.lockedUntil;
      state.lockedOn = lockedOn ? lockedOn : state.lockedOn;
      state.lockedPeriod = lockedPeriod ? lockedPeriod : state.lockedPeriod;
    }),
);
