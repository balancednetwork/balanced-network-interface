import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { CurrencyAmount, Currency } from 'types/balanced-sdk-core';

export const setStakedLPPercent = createAction<{ poolId: number; percent: BigNumber }>('stakedLP/setStakedLPPercent');
export const setWithdrawnValue = createAction<{
  poolId: number;
  percent: BigNumber;
  baseValue: CurrencyAmount<Currency>;
  quoteValue: CurrencyAmount<Currency>;
}>('stakedLP/setWithdrawnValue');
