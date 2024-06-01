import { Fraction } from '@balancednetwork/sdk-core';
import { createSlice } from '@reduxjs/toolkit';

import { VoteItemInfo } from './types';

export interface LiveVotingState {
  userData: Map<string, VoteItemInfo> | undefined;
  powerLeft: Fraction | undefined;
  editState: {
    editing: string;
    inputValue: string;
    showConfirmation: boolean;
  };
}

const initialState: LiveVotingState = {
  userData: undefined,
  powerLeft: undefined,
  editState: {
    editing: '',
    inputValue: '',
    showConfirmation: false,
  },
};

const liveVotingSlice = createSlice({
  name: 'liveVoting',
  initialState,
  reducers: create => ({
    changeUserData: create.reducer<{ userData: Map<string, VoteItemInfo> | undefined }>(
      (state, { payload: { userData } }) => {
        state.userData = userData;
      },
    ),
    changeEditing: create.reducer<{ editing: string }>((state, { payload: { editing } }) => {
      state.editState.editing = editing;
    }),
    changePowerLeft: create.reducer<{ powerLeft: Fraction | undefined }>((state, { payload: { powerLeft } }) => {
      state.powerLeft = powerLeft;
    }),
    changeInputValue: create.reducer<{ inputValue: string }>((state, { payload: { inputValue } }) => {
      state.editState.inputValue = inputValue;
    }),
    changeShowConfirmation: create.reducer<{ showConfirmation: boolean }>(
      (state, { payload: { showConfirmation } }) => {
        state.editState.showConfirmation = showConfirmation;
      },
    ),
  }),
});

export const { changeEditing, changeInputValue, changePowerLeft, changeShowConfirmation, changeUserData } =
  liveVotingSlice.actions;

export default liveVotingSlice.reducer;
