import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createAction } from '@reduxjs/toolkit';

import { Field } from '../loan/actions';

export const adjust = createAction('savings/adjust');

export const cancel = createAction('savings/cancel');

export const type = createAction<{ independentField?: Field; typedValue?: string; inputType?: 'slider' | 'text' }>(
  'savings/type',
);

export const changeLockedAmount = createAction<{
  lockedAmount: CurrencyAmount<Token>;
}>('savings/changeLockedAmount');
