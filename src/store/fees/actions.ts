import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createAction } from '@reduxjs/toolkit';

export const setFees = createAction<{
  fees?: { [key: string]: CurrencyAmount<Token> };
}>('fees/setFees');
