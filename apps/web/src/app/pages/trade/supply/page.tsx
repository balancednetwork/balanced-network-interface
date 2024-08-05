import React, { useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';

import LPPanel from './_components/LPPanel';
import { PoolPanelContext } from './_components/PoolPanelContext';
import LiquidityPoolsPanel from './_components/LiquidityPoolsPanel';

import { useTrackedTokenPairs } from '@/store/user/hooks';
import { useAvailablePairs, useBalances } from '@/hooks/useV2Pairs';

export function SupplyPage() {
  const { account } = useIconReact();

  const trackedTokenPairs = useTrackedTokenPairs();

  // fetch the reserves for all V2 pools
  const pairs = useAvailablePairs(trackedTokenPairs);

  // fetch the user's balances of all tracked V2 LP tokens
  const balances = useBalances(account, pairs);

  const data = useMemo(
    () => ({
      trackedTokenPairs,
      pairs,
      balances,
    }),
    [trackedTokenPairs, pairs, balances],
  );

  return (
    <PoolPanelContext.Provider value={data}>
      <LPPanel />

      <div style={{ marginTop: '50px' }}>
        <LiquidityPoolsPanel />
      </div>
    </PoolPanelContext.Provider>
  );
}
