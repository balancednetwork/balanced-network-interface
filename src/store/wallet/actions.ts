import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { createAction } from '@reduxjs/toolkit';

export const changeBalances = createAction<{
  [key: string]: CurrencyAmount<Currency>;
}>('wallet/changeBalances');

export const resetBalances = createAction('wallet/resetBalances');
