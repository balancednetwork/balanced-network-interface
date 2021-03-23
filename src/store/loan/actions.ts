import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const changeBorrowedValue = createAction<{ borrowedValue: BigNumber }>('loan/changeBorrowedValue');

export const changeAvailableValue = createAction<{ availabelValue: BigNumber }>('loan/changeAvailableValue');

export const changebnUSDbadDebt = createAction<{ bnUSDbadDebt: BigNumber }>('loan/changebnUSDbadDebt');

export const changebnUSDtotalSupply = createAction<{ bnUSDtotalSupply: BigNumber }>('loan/changebnUSDtotalSupply');
