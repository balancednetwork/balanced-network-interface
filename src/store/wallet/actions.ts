import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

// #redux-step-4: define action
export const changeValueBalance = createAction<{
  ICXbalance?: BigNumber;
  sICXbalance?: BigNumber;
  bnUSDbalance?: BigNumber;
  BALNbalance?: BigNumber;
}>('walletBalance/changeValueBalance'); // #redux-note: make sure action name is unique in global store
