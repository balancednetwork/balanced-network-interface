import { createAction } from '@reduxjs/toolkit';

import { DestinationXCallData, OriginXCallData } from 'app/_xcall/types';

export const addXCallOriginEvent = createAction<{
  chain?: string;
  data?: OriginXCallData;
}>('xCall/addXCallOriginEvent');

export const addXCallDestinationEvent = createAction<{
  chain?: string;
  data?: DestinationXCallData;
}>('xCall/addXCallDestinationEvent');

export const removeXCallOriginEvent = createAction<{
  chain?: string;
  sn?: number;
}>('xCall/removeXCallOriginEvent');

export const removeXCallDestinationEvent = createAction<{
  chain?: string;
  sn?: number;
}>('xCall/removeXCallDestinationEvent');

export const removeXCallEvent = createAction<{
  sn?: number;
  setToIdle?: boolean;
}>('xCall/removeXCallEvent');
