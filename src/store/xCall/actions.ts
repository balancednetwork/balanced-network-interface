import { createAction } from '@reduxjs/toolkit';

import {
  DestinationXCallData,
  OriginXCallData,
  SupportedXCallChains,
  XCallEventType,
  CurrentXCallStateType,
} from 'app/_xcall/types';

export const setXCallState = createAction<{
  state?: CurrentXCallStateType;
}>('xCall/setXCallState');

export const addXCallOriginEvent = createAction<{
  chain?: SupportedXCallChains;
  data?: OriginXCallData;
}>('xCall/addXCallOriginEvent');

export const addXCallDestinationEvent = createAction<{
  chain?: SupportedXCallChains;
  data?: DestinationXCallData;
}>('xCall/addXCallDestinationEvent');

export const removeXCallOriginEvent = createAction<{
  chain?: SupportedXCallChains;
  sn?: number;
}>('xCall/removeXCallOriginEvent');

export const removeXCallDestinationEvent = createAction<{
  chain?: SupportedXCallChains;
  sn?: number;
}>('xCall/removeXCallDestinationEvent');

export const removeXCallEvent = createAction<{
  sn?: number;
  setToIdle?: boolean;
}>('xCall/removeXCallEvent');

export const setListeningTo = createAction<{
  chain?: SupportedXCallChains;
  event: XCallEventType;
}>('xCall/setListeningTo');

export const rollBackFromOrigin = createAction<{
  chain?: SupportedXCallChains;
  sn?: number;
}>('xCall/rollBackFromOrigin');

export const flagRollBackReady = createAction<{
  chain?: SupportedXCallChains;
  sn?: number;
}>('xCall/flagRollBackReady');

export const setNotPristine = createAction('xCall/setNotPristine');

export const stopListening = createAction('xCall/stopListening');
