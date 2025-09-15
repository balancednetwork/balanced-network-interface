/**
 * Create the store with dynamic reducers
 */

import { configureStore } from '@reduxjs/toolkit';
import { load, save } from 'redux-localstorage-simple';

import application from './application/reducer';
import lists from './lists/reducer';
import oracle from './oracle/reducer';
import ratio from './ratio/reducer';
import stabilityFund from './stabilityFund/reducer';
import swap from './swap/reducer';
import transactions from './transactions/reducer';
import user from './user/reducer';
import wallet from './wallet/reducer';

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'lists', 'xCall'];

export function configureAppStore() {
  const store = configureStore({
    reducer: {
      application,
      ratio,
      wallet,
      transactions,
      swap,
      stabilityFund,
      user,
      oracle,
      lists,
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
