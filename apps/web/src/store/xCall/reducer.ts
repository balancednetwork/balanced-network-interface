import { createReducer } from '@reduxjs/toolkit';

import {
  CurrentXCallStateType,
  OriginXCallData,
  XChainId,
  XCallChainState,
  XCallEventType,
} from 'app/pages/trade/bridge-v2/types';
import { getFollowingEvent } from 'app/pages/trade/bridge-v2/utils';

import {
  addXCallOriginEvent,
  addXCallDestinationEvent,
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
    chain: XChainId;
    event: XCallEventType;
  };
  events: { [key in XChainId]: XCallChainState };
};

const emptyObj: XCallChainState = {
  origin: [],
  destination: [],
};

const initialState: XCallState = {
  xCall: CurrentXCallStateType.IDLE,
  events: {
    '0x1.icon': emptyObj,
    'archway-1': emptyObj,
    '0x2.icon': emptyObj,
    '0xa869.fuji': emptyObj,
    '0xa86a.avax': emptyObj,
    archway: emptyObj,
  },
};

export default createReducer(initialState, builder =>
  builder
    .addCase(addXCallOriginEvent, (state, { payload: { chain, data } }) => {
      if (chain && data) {
        state.events[chain]?.origin.push({ ...data, isPristine: true });
        state.xCall = CurrentXCallStateType.AWAITING_DESTINATION_CALL_MESSAGE;
        state.listeningTo = {
          chain: data.destination,
          event: getFollowingEvent(data.eventName),
        };
      }
    })
    .addCase(addXCallDestinationEvent, (state, { payload: { chain, data } }) => {
      if (chain && data) {
        state.events[chain]?.destination.push({ ...data, isPristine: true });
        state.xCall = CurrentXCallStateType.AWAITING_USER_CALL_EXECUTION;
        state.listeningTo = undefined;
      }
    })
    .addCase(removeXCallEvent, (state, { payload: { sn, setToIdle } }) => {
      if (sn) {
        // !TODO: make sure the below code is correct
        Object.values(state.events).forEach(e => {
          e.origin = e.origin.filter(data => data.sn !== sn);
          e.destination = e.destination.filter(data => data.sn !== sn);
        });
        // Object.keys(state.events).forEach((chain: XChainId) => {
        //   state.events[chain].origin = state.events[chain].origin.filter(data => data.sn !== sn);
        //   state.events[chain].destination = state.events[chain].destination.filter(data => data.sn !== sn);
        // });
        if (setToIdle) {
          state.xCall = CurrentXCallStateType.IDLE;
        }
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
      state.xCall = CurrentXCallStateType.IDLE;
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
