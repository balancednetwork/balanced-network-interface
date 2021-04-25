import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export const changeBorrowedAmount = createAction<{ borrowedAmount: BigNumber }>('loan/changeBorrowedAmount');

export const changeBadDebt = createAction<{ badDebt: BigNumber }>('loan/changeBadDebt');

export const changeTotalSupply = createAction<{ totalSupply: BigNumber }>('loan/changeTotalSupply');

export const changeTotalRepaid = createAction<{ totalRepaid: BigNumber }>('loan/changeTotalRepaid');

export const changeTotalCollateralSold = createAction<{ totalCollateralSold: BigNumber }>(
  'loan/changeTotalCollateralSold',
);

export const adjust = createAction('loan/adjust');

export const cancel = createAction('loan/cancel');

export const type = createAction<{ independentField?: Field; typedValue?: string; inputType?: 'slider' | 'text' }>(
  'loan/type',
);
