/**
 * Create the store with dynamic reducers
 */

import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { createInjectorsEnhancer } from 'redux-injectors';
import { save, load } from 'redux-localstorage-simple';
import createSagaMiddleware from 'redux-saga';

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
import { createReducer } from './reducers';
import reward from './reward/reducer';
import savings from './savings/reducer';
import stabilityFund from './stabilityFund/reducer';
import stakedLP from './stakedLP/reducer';
import swap from './swap/reducer';
import transactions from './transactions/reducer';
import transactionsCrosschain from './transactionsCrosschain/reducer';
import user from './user/reducer';
import wallet from './wallet/reducer';
import xCall from './xCall/reducer';

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'lists', 'xCall'];

export function configureAppStore() {
  const reduxSagaMonitorOptions = {};
  const sagaMiddleware = createSagaMiddleware(reduxSagaMonitorOptions);
  const { run: runSaga } = sagaMiddleware;

  // Create the store with saga middleware
  const middlewares = [sagaMiddleware];

  const enhancers = [
    createInjectorsEnhancer({
      createReducer,
      runSaga,
    }),
  ];

  const store = configureStore({
    reducer: createReducer({
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
      xCall,
      transactionsCrosschain,
      bridge,
      savings,
    }),
    middleware: [
      ...getDefaultMiddleware({
        serializableCheck: false,
      }),
      save({ states: PERSISTED_KEYS }),
      ...middlewares,
    ],
    preloadedState: load({ states: PERSISTED_KEYS }),
    devTools: process.env.NODE_ENV !== 'production',
    enhancers,
  });

  return store;
}
