import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { CurrencyKey, IcxDisplayType } from 'types';

export enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export const changeDepositedAmount = createAction<{ depositedAmount: BigNumber; token: string }>(
  'collateral/changeDepositedAmount',
);

export const changeCollateralType = createAction<{ collateralType: CurrencyKey }>('collateral/changeCollateralType');

export const changeIcxDisplayType = createAction<{ icxDisplayType: IcxDisplayType }>('collateral/changeIcxDisplayType');

export const adjust = createAction('collateral/adjust');

export const cancel = createAction('collateral/cancel');

export const type = createAction<{ independentField?: Field; typedValue?: string; inputType?: 'slider' | 'text' }>(
  'collateral/type',
);
