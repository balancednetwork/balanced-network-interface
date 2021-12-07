import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { Pool } from 'types';

import { setPoolData, setBalance, clearBalances } from './actions';

export interface Balance {
  baseCurrencyKey: string;
  quoteCurrencyKey: string;
  balance: BigNumber;
  balance1?: BigNumber;
}

export interface PoolState {
  pools: {
    [poolId: string]: Pool;
  };

  balances: {
    [poolId: string]: Balance;
  };
}

const initialState: PoolState = {
  pools: {},
  balances: {},
};

export default createReducer(initialState, builder =>
  builder
    .addCase(setPoolData, (state, { payload }) => {
      const { poolId, poolData } = payload;
      state.pools = {
        ...state.pools,
        [poolId]: {
          ...state.pools[poolId],
          ...poolData,
        },
      };
    })
    .addCase(setBalance, (state, { payload }) => {
      const { poolId, balance } = payload;
      state.balances = {
        ...state.balances,
        [poolId]: balance,
      };
    })
    .addCase(clearBalances, (state, { payload }) => {
      state.balances = {};
    }),
);
