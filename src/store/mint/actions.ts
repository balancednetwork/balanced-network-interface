import { createAction } from '@reduxjs/toolkit';

import { Currency } from 'types/balanced-sdk-core';

export enum Field {
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}

export const typeInput = createAction<{
  field: Field;
  typedValue: string;
  noLiquidity: boolean;
  inputType: 'slider' | 'text';
}>('mint/typeInputMint');
export const resetMintState = createAction<void>('mint/resetMintState');
export const selectCurrency = createAction<{ field: Field; currency: Currency }>('mint/selectCurrency');
