import { createSlice } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export interface RewardState {
  [poolId: string]: BigNumber;
}

const initialState: RewardState = {};

const rewardSlice = createSlice({
  name: 'reward',
  initialState,
  reducers: create => ({
    setReward: create.reducer<{ poolId: string; reward: BigNumber }>((state, { payload: { poolId, reward } }) => {
      state[poolId] = reward;
    }),
  }),
});

export const { setReward } = rewardSlice.actions;

export default rewardSlice.reducer;
