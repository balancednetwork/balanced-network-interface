import { createAction } from '@reduxjs/toolkit';

import { PairInfo } from 'constants/pairs';
import { Pool } from 'types';

import { Balance } from './reducer';

export const setPair = createAction<PairInfo>('pool/setPair');

export const setPoolData = createAction<{ poolId: number; poolData: Partial<Pool> }>('pool/setPoolData');

export const setBalance = createAction<{ poolId: number; balance: Balance }>('pool/setBalance');

export const clearBalances = createAction('pool/clearBalances');
