import { createReducer } from '@reduxjs/toolkit';

import { Pair, SUPPORTED_PAIRS } from 'constants/currency';

import { setPair } from './actions';

export interface PoolState {
  selectedPair: Pair;
}

const initialState: PoolState = {
  selectedPair: SUPPORTED_PAIRS[0],
};

export default createReducer(initialState, builder =>
  builder.addCase(setPair, (state, { payload }) => {
    state.selectedPair = payload;
  }),
);
