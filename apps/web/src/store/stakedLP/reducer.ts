import { CurrencyAmount, Currency } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { setStakedLPPercent, setWithdrawnValue } from './actions';

export interface StakedLPState {
  stakedLp: { [poolId: number]: BigNumber };
  withdrawn: {
    [poolId: number]: {
      percent: BigNumber;
      baseValue: CurrencyAmount<Currency>;
      quoteValue: CurrencyAmount<Currency>;
    };
  };
}

const initialState: StakedLPState = {
  stakedLp: {},
  withdrawn: {},
};

export default createReducer(initialState, builder =>
  builder
    .addCase(setStakedLPPercent, (state, { payload }) => {
      const { poolId, percent } = payload;
      state.stakedLp[poolId] = percent;
    })
    .addCase(setWithdrawnValue, (state, { payload }) => {
      const { poolId, percent, baseValue, quoteValue } = payload;
      state.withdrawn[poolId] = {
        percent: percent,
        baseValue: baseValue,
        quoteValue: quoteValue,
      };
    }),
);
