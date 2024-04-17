import { createReducer } from '@reduxjs/toolkit';

import { SupportedXCallChains } from 'app/_xcall/types';

import { setDestination, setOrigin } from './actions';

export interface BridgeState {
  direction: {
    from: SupportedXCallChains;
    to: SupportedXCallChains;
  };
}

const initialState: BridgeState = {
  direction: {
    from: 'archway',
    to: 'icon',
  },
};

export default createReducer(initialState, builder =>
  builder
    .addCase(setOrigin, (state, { payload: { chain } }) => {
      state.direction.from = chain;
    })
    .addCase(setDestination, (state, { payload: { chain } }) => {
      state.direction.to = chain;
    }),
);
