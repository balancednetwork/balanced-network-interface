import { createReducer } from '@reduxjs/toolkit';

import { CurrentXCallState, CurrentXCallStateType, SupportedXCallChains, XCallChainState } from 'app/_xcall/types';

import {
  addXCallOriginEvent,
  addXCallDestinationEvent,
  removeXCallDestinationEvent,
  removeXCallOriginEvent,
  removeXCallEvent,
} from './actions';

export type XCallState = {
  currentState: CurrentXCallStateType;
  listeningTo: undefined | SupportedXCallChains;
  events: { [key in SupportedXCallChains]: XCallChainState };
};

const initialState: XCallState = {
  currentState: CurrentXCallState.IDLE,
  listeningTo: undefined,
  events: {
    icon: {
      origin: [],
      destination: [],
    },
    archway: {
      origin: [],
      destination: [],
    },
  },
};

export default createReducer(initialState, builder =>
  builder
    .addCase(addXCallOriginEvent, (state, { payload: { chain, data } }) => {
      if (chain && data) {
        state.events[chain].origin.push(data);
        state.currentState = CurrentXCallState.AWAITING_DESTINATION_CALL_MESSAGE;
      }
    })
    .addCase(addXCallDestinationEvent, (state, { payload: { chain, data } }) => {
      if (chain && data) {
        // const originEvents = [...state[chain].origin];
        // console.log(
        //   originEvents,
        //   originEvents.find(o => o.sn === data.sn),
        //   data,
        // );
        // //if there is an origin event with the same sn, add the destination event to the origin event
        // if (originEvents.find(o => o.sn === data.sn)) {
        //   state[chain].destination.push(data);
        // }
        state.events[chain].destination.push(data);
        state.currentState = CurrentXCallState.AWAITING_USER_CALL_EXECUTION;
      }
    })
    .addCase(removeXCallEvent, (state, { payload: { sn, setToIdle } }) => {
      if (sn) {
        Object.keys(state.events).forEach(chain => {
          state.events[chain].origin = state.events[chain].origin.filter(data => data.sn !== sn);
          state.events[chain].destination = state.events[chain].destination.filter(data => data.sn !== sn);
        });
        if (setToIdle) {
          state.currentState = CurrentXCallState.IDLE;
        }
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
