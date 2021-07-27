import { createAction } from '@reduxjs/toolkit';

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

export const changeShouldLedgedSignMessage = createAction<{ shouldLedgerSign: boolean }>(
  'application/changeShouldLedgedSignMessage',
);

export const updateSlippageTolerance = createAction<{ slippageTolerance: number }>(
  'application/updateSlippageTolerance',
);
