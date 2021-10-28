import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { IcxDisplayType } from 'types';

export enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export const changeDepositedAmount = createAction<{ depositedAmount: BigNumber }>('collateral/changeDepositedAmount');

export const changeIcxDisplayType = createAction<{ icxDisplayType: IcxDisplayType }>('collateral/changeCollateralType');

export const adjust = createAction('collateral/adjust');

export const cancel = createAction('collateral/cancel');

export const type = createAction<{ independentField?: Field; typedValue?: string; inputType?: 'slider' | 'text' }>(
  'collateral/type',
);
