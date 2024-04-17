import { CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { LockedPeriod } from 'app/components/home/BBaln/types';

import { Field } from '../loan/actions';
import { Source } from './hooks';

export const adjust = createAction('bbaln/adjust');

export const cancel = createAction('bbaln/cancel');

export const type = createAction<{ independentField?: Field; typedValue?: string; inputType?: 'slider' | 'text' }>(
  'bbaln/type',
);

export const changePeriod = createAction<{ period: LockedPeriod }>('bbaln/changePeriod');

export const changeTotalSupply = createAction<{ totalSupply: BigNumber }>('bbaln/changeTotalSupply');

export const changeData = createAction<{
  lockedBaln: CurrencyAmount<Token>;
  lockEnd: Date;
  bbalnAmount: BigNumber;
  totalSupply: BigNumber;
}>('bbaln/changeData');

export const changeSources = createAction<{
  sources: { [key in string]: Source };
}>('bbaln/changeSources');
