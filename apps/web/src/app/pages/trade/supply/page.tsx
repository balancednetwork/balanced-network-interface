import React, { useMemo } from 'react';

import { useIconReact } from 'packages/icon-react';

import { SectionPanel } from 'app/components/trade/utils';
import LPPanel from 'app/components/trade/LPPanel';
import { PoolPanelContext } from 'app/components/trade/PoolPanelContext';
import LiquidityPoolsPanel from 'app/components/trade/LiquidityPoolsPanel';

import { useTrackedTokenPairs } from 'store/user/hooks';
import { useAvailablePairs, useBalances } from 'hooks/useV2Pairs';

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
      <SectionPanel bg="bg2">
        <LPPanel />
      </SectionPanel>

      <div style={{ marginTop: '50px' }}>
        <LiquidityPoolsPanel />
      </div>
    </PoolPanelContext.Provider>
  );
}
