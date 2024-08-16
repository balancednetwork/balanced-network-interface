import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { LockedPeriod } from '@/app/components/home/BBaln/types';
import { lockingPeriods } from '@/app/components/home/BBaln/utils';
import { Field, Source } from './hooks';

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

const bbalnSlice = createSlice({
  name: 'bbaln',
  initialState,
  reducers: create => ({
    changeData: create.reducer<{
      bbalnAmount: BigNumber;
      totalSupply: BigNumber;
      lockedBaln: CurrencyAmount<Token>;
      lockEnd: Date;
    }>((state, { payload: { bbalnAmount, totalSupply, lockedBaln, lockEnd } }) => {
      state.bbalnAmount = bbalnAmount;
      state.totalSupply = totalSupply;
      if (!state.lockedBaln?.equalTo(lockedBaln)) {
        state.lockedBaln = lockedBaln;
      }
      if (state.lockedUntil?.getTime() !== lockEnd.getTime()) {
        state.lockedUntil = lockEnd;
      }
    }),
    changeTotalSupply: create.reducer<{ totalSupply: BigNumber | undefined }>((state, { payload: { totalSupply } }) => {
      state.totalSupply = totalSupply;
    }),
    changeSources: create.reducer<{ sources: { [key in string]: Source } | undefined }>(
      (state, { payload: { sources } }) => {
        state.sources = sources;
      },
    ),
    adjust: create.reducer<void>(state => {
      state.state.isAdjusting = true;
    }),
    cancel: create.reducer<void>(state => {
      state.state.isAdjusting = false;
    }),
    changePeriod: create.reducer<{ period: LockedPeriod }>((state, { payload: { period } }) => {
      state.state.selectedPeriod = period;
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

export const { adjust, cancel, type, changeData, changePeriod, changeSources, changeTotalSupply } = bbalnSlice.actions;

export default bbalnSlice.reducer;
