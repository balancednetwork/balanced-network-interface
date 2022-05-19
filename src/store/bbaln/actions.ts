import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { LockedPeriod } from 'app/components/home/BBaln/types';

import { Field } from '../loan/actions';

export const adjust = createAction('bbaln/adjust');

export const cancel = createAction('bbaln/cancel');

export const type = createAction<{ independentField?: Field; typedValue?: string; inputType?: 'slider' | 'text' }>(
  'bbaln/type',
);

export const setBoost = createAction<{
  bbalnAmount?: BigNumber;
  lockedUntil?: Date;
  lockedOn?: Date;
  lockedBaln?: BigNumber;
  lockedPeriod?: LockedPeriod;
}>('bbaln/setBoost');
