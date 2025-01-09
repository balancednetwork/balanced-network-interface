import React from 'react';

import { Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';

import { BalanceData, Pool } from '@/hooks/useV2Pairs';

export const PoolPanelContext = React.createContext<{
  trackedTokenPairs: [Token, Token][];
  pairs: { [poolId: number]: Pair };
  balances: { [poolId: number]: BalanceData };
  pools: Pool[];
}>({
  trackedTokenPairs: [],
  pairs: {},
  balances: {},
  pools: [],
});

export const usePoolPanelContext = () => React.useContext(PoolPanelContext);
