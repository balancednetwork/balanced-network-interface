import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export const changeBorrowedValue = createAction<{ borrowedValue: BigNumber }>('loan/changeBorrowedValue');

export const changeAvailableValue = createAction<{ availabelValue: BigNumber }>('loan/changeAvailableValue');

export const changebnUSDbadDebt = createAction<{ bnUSDbadDebt: BigNumber }>('loan/changebnUSDbadDebt');

export const changebnUSDtotalSupply = createAction<{ bnUSDtotalSupply: BigNumber }>('loan/changebnUSDtotalSupply');

export const adjust = createAction('loan/adjust');

export const cancel = createAction('loan/cancel');

export const type = createAction<{ independentField?: Field; typedValue?: string; inputType?: 'slider' | 'text' }>(
  'loan/type',
);
