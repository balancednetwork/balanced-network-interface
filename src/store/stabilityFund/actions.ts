import { createAction } from '@reduxjs/toolkit';

import { CurrencyAmount, Token } from 'types/balanced-sdk-core';

export const setBalances = createAction<{
  balances?: { [key: string]: CurrencyAmount<Token> };
}>('stabilityFund/setBalances');
