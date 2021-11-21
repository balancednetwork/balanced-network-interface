import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { setStakedLPPercent } from './actions';

export interface StakedLPState {
  [poolId: number]: BigNumber;
}

const initialState: StakedLPState = {};

export default createReducer(initialState, builder =>
  builder.addCase(setStakedLPPercent, (state, { payload }) => {
    const { poolId, percent } = payload;
    state[poolId] = percent;
  }),
);
