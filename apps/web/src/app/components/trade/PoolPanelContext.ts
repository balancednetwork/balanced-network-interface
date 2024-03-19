import React from 'react';

import { Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';

import { BalanceData } from 'hooks/useV2Pairs';

export const PoolPanelContext = React.createContext<{
  trackedTokenPairs: [Token, Token][];
  pairs: { [poolId: number]: Pair };
  balances: { [poolId: number]: BalanceData };
}>({
  trackedTokenPairs: [],
  pairs: {},
  balances: {},
});

export const usePoolPanelContext = () => React.useContext(PoolPanelContext);
