import { createAction } from '@reduxjs/toolkit';

import { DestinationCallData, OriginCallData } from 'app/_xcall/types';

export const addXCallOriginEvent = createAction<{
  chain?: string;
  data?: OriginCallData;
}>('xCall/addXCallOriginEvent');

export const addXCallDestinationEvent = createAction<{
  chain?: string;
  data?: DestinationCallData;
}>('xCall/addXCallDestinationEvent');

export const removeXCallOriginEvent = createAction<{
  chain?: string;
  sn?: number;
}>('xCall/removeXCallOriginEvent');

export const removeXCallDestinationEvent = createAction<{
  chain?: string;
  sn?: number;
}>('xCall/removeXCallDestinationEvent');
