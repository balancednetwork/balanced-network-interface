import React, { useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';

import LPPanel from './_components/LPPanel';
import LiquidityPoolsPanel from './_components/LiquidityPoolsPanel';
import { PoolPanelContext } from './_components/PoolPanelContext';

import { useAvailablePairs, useBalances, usePools } from '@/hooks/useV2Pairs';
import { useSignedInWallets } from '@/hooks/useWallets';
import { useTrackedTokenPairs } from '@/store/user/hooks';

export function SupplyPage() {
  const { account } = useIconReact();

  const trackedTokenPairs = useTrackedTokenPairs();

  // fetch the reserves for all V2 pools
  const pairs = useAvailablePairs(trackedTokenPairs);

  // fetch the user's balances of all tracked V2 LP tokens
  const balances = useBalances(account, pairs);

  const signedWallets = useSignedInWallets();
  const accounts = useMemo(
    () => signedWallets.filter(wallet => wallet.address).map(wallet => `${wallet.xChainId}/${wallet.address}`),
    [signedWallets],
  );
  const pools = usePools(pairs, accounts);

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
