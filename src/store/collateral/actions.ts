import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const changeDeposite = createAction<{ depositedValue: BigNumber }>('collateral/changeDepositedValue');

export const changeBalance = createAction<{ balance: BigNumber }>('collateral/changeBalanceValue');
