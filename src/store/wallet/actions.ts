import { createAction } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

// #redux-step-4: define action
export const changeBalances = createAction<{
  ICX?: BigNumber;
  sICX?: BigNumber;
  bnUSD?: BigNumber;
  BALN?: BigNumber;
  BALNstaked?: BigNumber;
  BALNunstaking?: BigNumber;
  BALNreward?: BigNumber;
}>('wallet/changeBalances'); // #redux-note: make sure action name is unique in global store

export const resetBalances = createAction('wallet/resetBalances'); // #redux-note: make sure action name is unique in global store
