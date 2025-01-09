import React, { useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';

import LPPanel from './_components/LPPanel';
import LiquidityPoolsPanel from './_components/LiquidityPoolsPanel';
import { PoolPanelContext } from './_components/PoolPanelContext';

import { useAvailablePairs, useBalances, usePools } from '@/hooks/useV2Pairs';
import { useTrackedTokenPairs } from '@/store/user/hooks';

export function SupplyPage() {
  const { account } = useIconReact();

  const trackedTokenPairs = useTrackedTokenPairs();

  // fetch the reserves for all V2 pools
  const pairs = useAvailablePairs(trackedTokenPairs);

  // fetch the user's balances of all tracked V2 LP tokens
  const balances = useBalances(account, pairs);

  const pools = usePools(pairs, [
    `0x1.icon/hxe25ae17a21883803185291baddac0120493ff706`,
    `0xa4b1.arbitrum/0x6C5F91FD68Dd7b3A1aedB0F09946659272f523a4`,
  ]);

  const data = useMemo(
    () => ({
      trackedTokenPairs,
      pairs,
      balances,
      pools: pools || [],
    }),
    [trackedTokenPairs, pairs, balances, pools],
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
