import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createAction } from '@reduxjs/toolkit';

export const setBalances = createAction<{
  balances?: { [key: string]: CurrencyAmount<Token> };
}>('stabilityFund/setBalances');
