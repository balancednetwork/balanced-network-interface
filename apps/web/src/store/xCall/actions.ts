import { createAction } from '@reduxjs/toolkit';

import {
  DestinationXCallData,
  OriginXCallData,
  XChainId,
  XCallEventType,
  CurrentXCallStateType,
} from 'app/pages/trade/bridge/types';

export const setXCallState = createAction<{
  state?: CurrentXCallStateType;
}>('xCall/setXCallState');

export const addXCallOriginEvent = createAction<{
  chain?: XChainId;
  data?: OriginXCallData;
}>('xCall/addXCallOriginEvent');

export const addXCallDestinationEvent = createAction<{
  chain?: XChainId;
  data?: DestinationXCallData;
}>('xCall/addXCallDestinationEvent');

export const removeXCallEvent = createAction<{
  sn?: number;
  setToIdle?: boolean;
}>('xCall/removeXCallEvent');

export const setListeningTo = createAction<{
  chain?: XChainId;
  event: XCallEventType;
}>('xCall/setListeningTo');

export const rollBackFromOrigin = createAction<{
  chain?: XChainId;
  sn?: number;
}>('xCall/rollBackFromOrigin');

export const flagRollBackReady = createAction<{
  chain?: XChainId;
  sn?: number;
}>('xCall/flagRollBackReady');

export const setNotPristine = createAction('xCall/setNotPristine');

export const stopListening = createAction('xCall/stopListening');
