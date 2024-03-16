/**
 * Create the store with dynamic reducers
 */

import React from 'react';

import { configureStore } from '@reduxjs/toolkit';
import { createDispatchHook, createSelectorHook, ReactReduxContextValue } from 'react-redux';
import {} from 'react-redux';
import bridge from './bridge/bridge';
import account from './models/account';

const store = configureStore({
  reducer: {
    account,
    bridge,
  },
});

export type BTPAppState = ReturnType<typeof store.getState>;
export type BTPAppDispatch = typeof store.dispatch;

// @ts-ignore
export const BTPContext = React.createContext<ReactReduxContextValue<BTPAppState> | null>({
  store,
});
BTPContext.displayName = 'BTPContext';

export const useBTPSelector = createSelectorHook(BTPContext);
export const useBTPDispatch = createDispatchHook(BTPContext);
export default store;
