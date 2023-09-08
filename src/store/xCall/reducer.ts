import { createReducer } from '@reduxjs/toolkit';

import { SupportedXCallChains, XCallChainState } from 'app/_xcall/types';

import {
  addXCallOriginEvent,
  addXCallDestinationEvent,
  removeXCallDestinationEvent,
  removeXCallOriginEvent,
} from './actions';

export type XCallState = {
  [key in SupportedXCallChains]: XCallChainState;
};

const initialState: XCallState = {
  icon: {
    origin: [],
    destination: [],
  },
  archway: {
    origin: [],
    destination: [],
  },
};

export default createReducer(initialState, builder =>
  builder
    .addCase(addXCallOriginEvent, (state, { payload: { chain, data } }) => {
      if (chain && data) {
        state[chain].origin.push(data);
      }
    })
    .addCase(addXCallDestinationEvent, (state, { payload: { chain, data } }) => {
      if (chain && data) {
        state[chain].destination.push(data);
      }
    })
    .addCase(removeXCallOriginEvent, (state, { payload: { chain, sn } }) => {
      if (chain && sn) {
        state[chain].origin = state[chain].origin.filter(data => data.sn !== sn);
      }
    })
    .addCase(removeXCallDestinationEvent, (state, { payload: { chain, sn } }) => {
      if (chain && sn) {
        state[chain].destination = state[chain].destination.filter(data => data.sn !== sn);
      }
    }),
);
