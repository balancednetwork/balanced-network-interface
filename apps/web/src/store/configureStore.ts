/**
 * Create the store with dynamic reducers
 */

import { configureStore } from '@reduxjs/toolkit';
import { save, load } from 'redux-localstorage-simple';

import application from './application/reducer';
import arbitraryCalls from './arbitraryCalls/reducer';
import bbaln from './bbaln/reducer';
import bridge from './bridge/reducer';
import collateral from './collateral/reducer';
import fees from './fees/reducer';
import lists from './lists/reducer';
import liveVoting from './liveVoting/reducer';
import loan from './loan/reducer';
import mint from './mint/reducer';
import oracle from './oracle/reducer';
import ratio from './ratio/reducer';
import reward from './reward/reducer';
import savings from './savings/reducer';
import stabilityFund from './stabilityFund/reducer';
import stakedLP from './stakedLP/reducer';
import swap from './swap/reducer';
import transactions from './transactions/reducer';
import transactionsCrosschain from './transactionsCrosschain/reducer';
import user from './user/reducer';
import wallet from './wallet/reducer';

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'lists', 'xCall'];

export function configureAppStore() {
  const store = configureStore({
    reducer: {
      application,
      bbaln,
      reward,
      collateral,
      loan,
      ratio,
      wallet,
      transactions,
      mint,
      swap,
      stabilityFund,
      stakedLP,
      user,
      fees,
      oracle,
      lists,
      liveVoting,
      arbitraryCalls,
      transactionsCrosschain,
      bridge,
      savings,
    },
    middleware: getDefaultMiddleware =>
      getDefaultMiddleware({
        serializableCheck: false,
      }).concat(save({ states: PERSISTED_KEYS })),
    preloadedState: load({ states: PERSISTED_KEYS }),
    devTools: process.env.NODE_ENV !== 'production',
  });

  return store;
}
