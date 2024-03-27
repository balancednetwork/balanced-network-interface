import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

export const setReward = createAction<{ poolId: string; reward: BigNumber }>('reward/setReward');
