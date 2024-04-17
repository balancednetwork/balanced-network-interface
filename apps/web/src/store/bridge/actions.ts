import { createAction } from '@reduxjs/toolkit';

import { SupportedXCallChains } from 'app/_xcall/types';

export const setOrigin = createAction<{
  chain: SupportedXCallChains;
}>('bridge/setOrigin');

export const setDestination = createAction<{
  chain: SupportedXCallChains;
}>('bridge/setDestination');
