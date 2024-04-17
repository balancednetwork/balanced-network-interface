import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { setReward } from './actions';

export interface RewardState {
  [poolId: string]: BigNumber;
}

const initialState: RewardState = {};

export default createReducer(initialState, builder =>
  builder.addCase(setReward, (state, { payload }) => {
    const { poolId, reward } = payload;
    state[poolId] = reward;
  }),
);
