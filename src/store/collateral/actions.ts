import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export enum Field {
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export const changeDeposite = createAction<{ depositedValue: BigNumber }>('collateral/changeDepositedValue');

export const changeBalance = createAction<{ balance: BigNumber }>('collateral/changeBalanceValue');

export const adjust = createAction('collateral/adjust');

export const cancel = createAction('collateral/cancel');

export const type = createAction<{ independentField?: Field; typedValue?: string; inputType?: 'slider' | 'text' }>(
  'collateral/type',
);

// export const slide = createAction<{ balance: BigNumber }>('collateral/slide');
