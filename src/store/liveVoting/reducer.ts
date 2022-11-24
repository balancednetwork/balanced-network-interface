import { Fraction } from '@balancednetwork/sdk-core';
import { createReducer } from '@reduxjs/toolkit';

import { changeEditing, changeInputValue, changePowerLeft, changeShowConfirmation, changeUserData } from './actions';
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

export default createReducer(initialState, builder =>
  builder
    .addCase(changeUserData, (state, { payload: { userData } }) => {
      state.userData = userData;
    })
    .addCase(changeEditing, (state, { payload: { editing } }) => {
      state.editState.editing = editing;
    })
    .addCase(changePowerLeft, (state, { payload: { powerLeft } }) => {
      state.powerLeft = powerLeft;
    })
    .addCase(changeInputValue, (state, { payload: { inputValue } }) => {
      state.editState.inputValue = inputValue;
    })
    .addCase(changeShowConfirmation, (state, { payload: { showConfirmation } }) => {
      state.editState.showConfirmation = showConfirmation;
    }),
);
