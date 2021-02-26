import { createAction } from '@reduxjs/toolkit';

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
