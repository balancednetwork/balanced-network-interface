import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const changeBalances = createAction<{
  [key: string]: BigNumber;
}>('wallet/changeBalances');

export const resetBalances = createAction('wallet/resetBalances');
