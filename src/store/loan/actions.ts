import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export const changeBorrowedAmount = createAction<{ borrowedAmount: BigNumber; collateralType: string }>(
  'loan/changeBorrowedAmount',
);

export const setLockingRatio = createAction<{ lockingRatio: number; collateralType: string }>('loan/setLockingRatio');

export const changeBadDebt = createAction<{ badDebt: BigNumber }>('loan/changeBadDebt');

export const changeTotalSupply = createAction<{ totalSupply: BigNumber }>('loan/changeTotalSupply');

export const adjust = createAction('loan/adjust');

export const cancel = createAction('loan/cancel');

export const type = createAction<{ independentField?: Field; typedValue?: string; inputType?: 'slider' | 'text' }>(
  'loan/type',
);
