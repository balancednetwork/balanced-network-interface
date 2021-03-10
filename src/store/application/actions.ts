import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export type PopupContent = {
  txn: {
    hash: string;
    success: boolean;
    summary?: string;
  };
};

export const addPopup = createAction<{ key?: string; removeAfterMs?: number | null; content: PopupContent }>(
  'application/addPopup',
);

export const removePopup = createAction<{ key: string }>('application/removePopup');

// Collateral
export const changeDeposite = createAction<{ depositedValue: BigNumber }>('application/changeDepositedValue');

export const changeBalance = createAction<{ balance: BigNumber }>('application/changeBalanceValue');

// Account
export const changeAccount = createAction<{ account: string }>('application/changeAccount');
