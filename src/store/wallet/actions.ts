import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { createAction } from '@reduxjs/toolkit';

export const changeICONBalances = createAction<{
  [key: string]: CurrencyAmount<Currency>;
}>('wallet/changeICONBalances');

export const changeArchwayBalances = createAction<{
  [key: string]: CurrencyAmount<Currency>;
}>('wallet/changeArchwayBalances');

export const resetBalances = createAction('wallet/resetBalances');
