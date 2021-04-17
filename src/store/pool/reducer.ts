import { createReducer } from '@reduxjs/toolkit';
import BigNumber from 'bignumber.js';

import { Pair, SUPPORTED_PAIRS } from 'constants/currency';

import { setPair, setPoolData, setBalance, setReward, clearBalances } from './actions';

export interface Pool {
  baseCurrencyKey: string;
  quoteCurrencyKey: string;
  base: BigNumber;
  quote: BigNumber;
  total: BigNumber;
  rewards: BigNumber;
  rate: BigNumber;
  inverseRate: BigNumber;
}

export interface Balance {
  baseCurrencyKey: string;
  quoteCurrencyKey: string;
  balance: BigNumber;
}

export interface PoolState {
  selectedPair: Pair;

  pools: {
    [poolId: string]: Pool;
  };

  balances: {
    [poolId: string]: Balance;
  };

  rewards: {
    [poolId: string]: BigNumber;
  };
}

const initialState: PoolState = {
  selectedPair: SUPPORTED_PAIRS[0],
  pools: {},
  balances: {},
  rewards: {},
};

export default createReducer(initialState, builder =>
  builder
    .addCase(setPair, (state, { payload }) => {
      state.selectedPair = payload;
    })
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
    .addCase(setReward, (state, { payload }) => {
      const { poolId, reward } = payload;
      state.rewards = {
        ...state.rewards,
        [poolId]: reward,
      };
    })
    .addCase(clearBalances, (state, { payload }) => {
      state.balances = {};
    }),
);
