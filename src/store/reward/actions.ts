import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const changeReward = createAction<{
  sICXbnUSDreward?: BigNumber;
  BALNbnUSDreward?: BigNumber;
  sICXICXreward?: BigNumber;
  loan?: BigNumber;
  poolDailyReward?: BigNumber;
}>('reward/changeReward');
