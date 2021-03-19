/**
 * Create the store with dynamic reducers
 */

import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit';
import { createInjectorsEnhancer } from 'redux-injectors';
import createSagaMiddleware from 'redux-saga';

import application from './application/reducer';
import collateral from './collateral/reducer';
import liquidity from './liquidity/reducer';
import loan from './loan/reducer';
import pool from './pool/reducer';
import ratio from './ratio/reducer';
import { createReducer } from './reducers';
import walletBalance from './wallet/reducer';

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
      // #redux-step-8: add more reducer from 'store/**/reducer.ts'
      application,
      pool,
      collateral,
      liquidity,
      loan,
      ratio,
      walletBalance,
    }),
    middleware: [
      ...getDefaultMiddleware({
        serializableCheck: false,
      }),
      ...middlewares,
    ],
    devTools: process.env.NODE_ENV !== 'production',
    enhancers,
  });

  return store;
}
