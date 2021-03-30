import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const changeReward = createAction<{
  sICXbnUSDreward?: BigNumber;
  sICXICXreward?: BigNumber;
  poolDailyReward?: BigNumber;
}>('reward/changeReward');
