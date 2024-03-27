import { CurrencyAmount, Currency } from '@balancednetwork/sdk-core';
import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const setStakedLPPercent = createAction<{ poolId: number; percent: BigNumber }>('stakedLP/setStakedLPPercent');
export const setWithdrawnValue = createAction<{
  poolId: number;
  percent: BigNumber;
  baseValue: CurrencyAmount<Currency>;
  quoteValue: CurrencyAmount<Currency>;
}>('stakedLP/setWithdrawnValue');
