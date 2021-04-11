import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

// #redux-step-4: define action
export const changeValueBalance = createAction<{
  ICX?: BigNumber;
  sICX?: BigNumber;
  bnUSD?: BigNumber;
  BALN?: BigNumber;
  BALNreward?: BigNumber;
}>('wallet/changeValueBalance'); // #redux-note: make sure action name is unique in global store
