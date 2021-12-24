import { createAction } from '@reduxjs/toolkit';

import { Currency, CurrencyAmount } from 'types/balanced-sdk-core';

export const changeBalances = createAction<{
  [key: string]: CurrencyAmount<Currency>;
}>('wallet/changeBalances');

export const resetBalances = createAction('wallet/resetBalances');
