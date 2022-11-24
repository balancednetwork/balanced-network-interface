import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { LockedPeriod } from 'app/components/home/BBaln/types';
import { lockingPeriods } from 'app/components/home/BBaln/utils';

import { Field } from '../loan/actions';
import { adjust, cancel, type, changeData, changePeriod, changeSources, changeTotalSupply } from './actions';
import { Source } from './hooks';

export interface BBalnState {
  bbalnAmount: BigNumber;
  lockedBaln: undefined | CurrencyAmount<Token>;
  lockedUntil: Date | undefined;
  lockedPeriod: LockedPeriod | undefined;
  totalSupply: BigNumber | undefined;
  sources: { [key in string]: Source } | undefined;

  state: {
    isAdjusting: boolean;
    typedValue: string;
    independentField: Field;
    inputType: 'slider' | 'text';
    selectedPeriod: LockedPeriod;
  };
}

const initialState: BBalnState = {
  bbalnAmount: new BigNumber(0),
  lockedBaln: undefined,
  lockedUntil: undefined,
  lockedPeriod: undefined,
  totalSupply: undefined,
  sources: undefined,

  state: {
    isAdjusting: false,
    typedValue: '',
    independentField: Field.LEFT,
    inputType: 'text',
    selectedPeriod: lockingPeriods[0],
  },
};

export default createReducer(initialState, builder =>
  builder
    .addCase(changeData, (state, { payload }) => {
      state.bbalnAmount = payload.bbalnAmount;
      state.totalSupply = payload.totalSupply;
      if (!state.lockedBaln?.equalTo(payload.lockedBaln)) {
        state.lockedBaln = payload.lockedBaln;
      }
      if (state.lockedUntil?.getTime() !== payload.lockEnd.getTime()) {
        state.lockedUntil = payload.lockEnd;
      }
    })
    .addCase(changeTotalSupply, (state, { payload }) => {
      state.totalSupply = payload.totalSupply;
    })
    .addCase(changeSources, (state, { payload }) => {
      state.sources = payload.sources;
    })
    .addCase(adjust, (state, { payload }) => {
      state.state.isAdjusting = true;
    })
    .addCase(cancel, (state, { payload }) => {
      state.state.isAdjusting = false;
    })
    .addCase(changePeriod, (state, { payload }) => {
      state.state.selectedPeriod = payload.period;
    })
    .addCase(type, (state, { payload: { independentField, typedValue, inputType } }) => {
      state.state.independentField = independentField || state.state.independentField;
      state.state.typedValue = typedValue ?? state.state.typedValue;
      state.state.inputType = inputType || state.state.inputType;
    }),
);
