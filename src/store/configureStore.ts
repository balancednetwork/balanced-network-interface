/**
 * Create the store with dynamic reducers
 */

import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { createInjectorsEnhancer } from 'redux-injectors';
import { save, load } from 'redux-localstorage-simple';
import createSagaMiddleware from 'redux-saga';

import application from './application/reducer';
import collateral from './collateral/reducer';
import loan from './loan/reducer';
import mint from './mint/reducer';
import pool from './pool/reducer';
import ratio from './ratio/reducer';
import { createReducer } from './reducers';
import reward from './reward/reducer';
import swap from './swap/reducer';
import transactions from './transactions/reducer';
import user from './user/reducer';
import wallet from './wallet/reducer';

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'lists'];

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
      pool,
      reward,
      collateral,
      loan,
      ratio,
      wallet,
      transactions,
      mint,
      swap,
      user,
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
