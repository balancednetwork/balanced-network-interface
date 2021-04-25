import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export type PopupContent = {
  txn: {
    hash: string;
    success: boolean;
    summary?: string;
  };
};

export enum ApplicationModal {
  WALLET,
  SETTINGS,
  SELF_CLAIM,
  ADDRESS_CLAIM,
  CLAIM_POPUP,
  MENU,
  DELEGATE,
  VOTE,
}

export const addPopup = createAction<{ key?: string; removeAfterMs?: number | null; content: PopupContent }>(
  'application/addPopup',
);

export const removePopup = createAction<{ key: string }>('application/removePopup');

export const setOpenModal = createAction<ApplicationModal | null>('application/setOpenModal');
// Collateral
export const changeDeposite = createAction<{ depositedValue: BigNumber }>('application/changeDepositedValue');

export const changeBalance = createAction<{ balance: BigNumber }>('application/changeBalanceValue');
