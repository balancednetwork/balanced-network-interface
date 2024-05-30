import { CurrencyAmount, Currency } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

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

const stakedLPSlice = createSlice({
  name: 'stakedLP',
  initialState,
  reducers: create => ({
    setStakedLPPercent: create.reducer<{ poolId: number; percent: BigNumber }>(
      (state, { payload: { poolId, percent } }) => {
        state.stakedLp[poolId] = percent;
      },
    ),
    setWithdrawnValue: create.reducer<{
      poolId: number;
      percent: BigNumber;
      baseValue: CurrencyAmount<Currency>;
      quoteValue: CurrencyAmount<Currency>;
    }>((state, { payload: { poolId, percent, baseValue, quoteValue } }) => {
      state.withdrawn[poolId] = {
        percent: percent,
        baseValue: baseValue,
        quoteValue: quoteValue,
      };
    }),
  }),
});

export const { setStakedLPPercent, setWithdrawnValue } = stakedLPSlice.actions;

export default stakedLPSlice.reducer;
