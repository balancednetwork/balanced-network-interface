import { createReducer } from '@reduxjs/toolkit';

import { changeConfig } from './actions';

export interface TokenListState {
  community: boolean;
}

const initialState: TokenListState = {
  community: false,
};

export default createReducer(initialState, builder =>
  builder.addCase(changeConfig, (state, { payload: { community } }) => {
    state.community = community;
  }),
);
