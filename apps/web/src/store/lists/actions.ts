import { createAction } from '@reduxjs/toolkit';

export const changeConfig = createAction<{
  community: boolean;
}>('lists/changeConfig');
