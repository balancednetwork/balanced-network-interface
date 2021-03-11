import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const changeBorrowedValue = createAction<{ borrowedValue: BigNumber }>('loan/changeBorrowedValue');

export const changeAvailabelValue = createAction<{ availabelValue: BigNumber }>('loan/changeAvailabelValue');

export const changebnUSDbadDebt = createAction<{ bnUSDbadDebt: BigNumber }>('loan/changebnUSDbadDebt');

export const changebnUSDtotalSupply = createAction<{ bnUSDtotalSupply: BigNumber }>('loan/changebnUSDtotalSupply');
