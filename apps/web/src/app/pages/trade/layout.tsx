import React from 'react';

import { Trans } from '@lingui/macro';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useIconReact } from '@/packages/icon-react';
import { useFetchBBalnInfo, useFetchBBalnSources } from '@/store/bbaln/hooks';
import { useFetchOraclePrices } from '@/store/oracle/hooks';
import { useFetchPrice } from '@/store/ratio/hooks';
import { useFetchStabilityFundBalances } from '@/store/stabilityFund/hooks';
import { useWalletFetchBalances } from '@/store/wallet/hooks';

export function TradePageLayout() {
  const { account } = useIconReact();
  const location = useLocation();
  const navigate = useNavigate();

  useFetchPrice();
  useFetchOraclePrices();
  useFetchBBalnSources(5000, true);
  useWalletFetchBalances();
  useFetchBBalnInfo(account);
  useFetchStabilityFundBalances();

  const handleTabClick = (value: string) => {
    navigate(`/${value}`);
  };

  const value = location.pathname.split('/')[1];

  return (
    <div className="flex-1 flex justify-center">
      <div className="flex flex-col mb-10 w-full max-w-md">
        <Tabs value={value} onValueChange={handleTabClick}>
          <TabsList>
            <TabsTrigger value="swap">
              <Trans>Swap</Trans>
            </TabsTrigger>
            <TabsTrigger value="limit">
              <Trans>Limit</Trans>
            </TabsTrigger>
            <TabsTrigger value="dca">
              <Trans>DCA</Trans>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Outlet />
      </div>
    </div>
  );
}
