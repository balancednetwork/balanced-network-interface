import { Fraction } from '@balancednetwork/sdk-core';
import { createAction } from '@reduxjs/toolkit';

import { VoteItemInfo } from './types';

export const changeUserData = createAction<{
  userData: Map<string, VoteItemInfo> | undefined;
}>('liveVoting/changeUserData');

export const changeEditing = createAction<{
  editing: string;
}>('liveVoting/changeEditing');

export const changePowerLeft = createAction<{
  powerLeft: Fraction | undefined;
}>('liveVoting/changePowerLeft');

export const changeInputValue = createAction<{
  inputValue: string;
}>('liveVoting/changeInputValue');

export const changeShowConfirmation = createAction<{
  showConfirmation: boolean;
}>('liveVoting/changeShowConfirmation');
