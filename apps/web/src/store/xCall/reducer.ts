import { createReducer } from '@reduxjs/toolkit';

import {
  CurrentXCallState,
  CurrentXCallStateType,
  OriginXCallData,
  SupportedXCallChains,
  XCallChainState,
  XCallEventType,
} from 'app/_xcall/types';
import { getFollowingEvent } from 'app/_xcall/utils';

import {
  addXCallOriginEvent,
  addXCallDestinationEvent,
  removeXCallDestinationEvent,
  removeXCallOriginEvent,
  removeXCallEvent,
  stopListening,
  setListeningTo,
  rollBackFromOrigin,
  flagRollBackReady,
  setNotPristine,
} from './actions';

export type XCallState = {
  xCall: CurrentXCallStateType;
  listeningTo?: {
    chain: SupportedXCallChains;
    event: XCallEventType;
  };
  events: { [key in SupportedXCallChains]: XCallChainState };
};

const initialState: XCallState = {
  xCall: CurrentXCallState.IDLE,
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
        state.events[chain].origin.push({ ...data, isPristine: true });
        state.xCall = CurrentXCallState.AWAITING_DESTINATION_CALL_MESSAGE;
        state.listeningTo = {
          chain: data.destination,
          event: getFollowingEvent(data.eventName),
        };
      }
    })
    .addCase(addXCallDestinationEvent, (state, { payload: { chain, data } }) => {
      if (chain && data) {
        state.events[chain].destination.push({ ...data, isPristine: true });
        state.xCall = CurrentXCallState.AWAITING_USER_CALL_EXECUTION;
        state.listeningTo = undefined;
      }
    })
    .addCase(removeXCallEvent, (state, { payload: { sn, setToIdle } }) => {
      if (sn) {
        Object.keys(state.events).forEach(chain => {
          state.events[chain].origin = state.events[chain].origin.filter(data => data.sn !== sn);
          state.events[chain].destination = state.events[chain].destination.filter(data => data.sn !== sn);
        });
        if (setToIdle) {
          state.xCall = CurrentXCallState.IDLE;
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
    })
    .addCase(setListeningTo, (state, { payload: { chain, event } }) => {
      if (chain && event) {
        state.listeningTo = {
          chain,
          event,
        };
      }
    })
    .addCase(stopListening, state => {
      state.listeningTo = undefined;
      state.xCall = CurrentXCallState.IDLE;
    })
    .addCase(rollBackFromOrigin, (state, { payload: { chain, sn } }) => {
      if (chain && sn) {
        const originEvent: OriginXCallData | undefined = state.events[chain].origin.find(data => data.sn === sn);
        if (originEvent) {
          originEvent.rollbackRequired = true;
          state.events[chain].origin = state.events[chain].origin.map(data => {
            if (data.sn === originEvent.sn) {
              return originEvent;
            }
            return data;
          });
        }
      }
    })
    .addCase(flagRollBackReady, (state, { payload: { chain, sn } }) => {
      if (chain && sn) {
        const originEvent: OriginXCallData | undefined = state.events[chain].origin.find(data => data.sn === sn);
        if (originEvent) {
          originEvent.rollbackReady = true;
          state.events[chain].origin = state.events[chain].origin.map(data => {
            if (data.sn === originEvent.sn) {
              return originEvent;
            }
            return data;
          });
        }
      }
    })
    .addCase(setNotPristine, state => {
      Object.keys(state.events).forEach(chain => {
        state.events[chain].origin = state.events[chain].origin.map(data => ({ ...data, isPristine: false }));
        state.events[chain].destination = state.events[chain].destination.map(data => ({ ...data, isPristine: false }));
      });
    }),
);
