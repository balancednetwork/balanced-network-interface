import { createSlice } from '@reduxjs/toolkit';

export interface TokenListState {
  community: boolean;
}

const initialState: TokenListState = {
  community: false,
};

const listsSlice = createSlice({
  name: 'lists',
  initialState,
  reducers: create => ({
    changeConfig: create.reducer<{ community: boolean }>((state, { payload: { community } }) => {
      state.community = community;
    }),
  }),
});

export const { changeConfig } = listsSlice.actions;

export default listsSlice.reducer;
