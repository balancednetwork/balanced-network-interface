import { createAction } from '@reduxjs/toolkit';

import { Pair } from 'constants/currency';

import { Pool, Balance } from './reducer';

export const setPair = createAction<Pair>('pool/setPair');

export const setPoolData = createAction<{ poolId: number; poolData: Partial<Pool> }>('pool/setPoolData');

export const setBalance = createAction<{ poolId: number; balance: Balance }>('pool/setBalance');

export const clearBalances = createAction('pool/clearBalances');
