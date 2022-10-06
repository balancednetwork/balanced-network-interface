import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { Field } from '../loan/actions';

export const adjust = createAction('bbaln/adjust');

export const cancel = createAction('bbaln/cancel');

export const type = createAction<{ independentField?: Field; typedValue?: string; inputType?: 'slider' | 'text' }>(
  'bbaln/type',
);

export const changeData = createAction<{
  lockedBaln: CurrencyAmount<Token>;
  lockEnd: Date;
  bbalnAmount: BigNumber;
  totalSupply: BigNumber;
}>('bbaln/changeData');
