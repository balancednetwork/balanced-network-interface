import { createAction } from '@reduxjs/toolkit';

export const resetAccount = createAction('bridge/resetAccount');

export const setFromNetwork = createAction<{ network: any }>('bridge/setFromNetwork');
export const setToNetwork = createAction<{ network: any }>('bridge/setToNetwork');
