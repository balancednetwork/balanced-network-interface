import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { changeReward } from './actions';

export interface RewardState {
  sICXbnUSDreward?: BigNumber;
  BALNbnUSDreward?: BigNumber;
  sICXICXreward?: BigNumber;
  poolDailyReward?: BigNumber;
}

const initialState: RewardState = {
  sICXbnUSDreward: new BigNumber(0),
  BALNbnUSDreward: new BigNumber(0),
  sICXICXreward: new BigNumber(0),
  poolDailyReward: new BigNumber(0),
};

export default createReducer(initialState, builder =>
  builder.addCase(
    changeReward,
    (state, { payload: { sICXbnUSDreward, BALNbnUSDreward, sICXICXreward, poolDailyReward } }) => {
      state.sICXbnUSDreward = sICXbnUSDreward || state.sICXbnUSDreward;
      state.BALNbnUSDreward = BALNbnUSDreward || state.BALNbnUSDreward;
      state.sICXICXreward = sICXICXreward || state.sICXICXreward;
      state.poolDailyReward = poolDailyReward || state.poolDailyReward;
    },
  ),
);
