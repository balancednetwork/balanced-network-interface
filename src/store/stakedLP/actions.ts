import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const setStakedLPPercent = createAction<{ poolId: number; percent: BigNumber }>('stakedLP/setStakedLPPercent');
export const setWithdrawnValue = createAction<{
  poolId: number;
  percent: BigNumber;
  baseValue: BigNumber;
  quoteValue: BigNumber;
}>('stakedLP/setWithdrawnValue');
