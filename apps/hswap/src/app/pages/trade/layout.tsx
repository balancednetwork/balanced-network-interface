import React from 'react';

import { Trans } from '@lingui/macro';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFetchOraclePrices } from '@/store/oracle/hooks';
import { useFetchPrice } from '@/store/ratio/hooks';
import { useFetchStabilityFundBalances } from '@/store/stabilityFund/hooks';
import { useWalletFetchBalances } from '@/store/wallet/hooks';

export function TradePageLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  useFetchPrice();
  useFetchOraclePrices();
  useWalletFetchBalances();
  useFetchStabilityFundBalances();

  const handleTabClick = (value: string) => {
    navigate(`/${value}`);
  };

  const value = location.pathname.split('/')[1];

  return (
    <div className="flex-1 flex justify-center">
      <div className="flex flex-col mb-10 w-full max-w-md">
        <Tabs value={value} onValueChange={handleTabClick}>
          <TabsList className="gap-2">
            <TabsTrigger
              value="swap"
              className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex"
            >
              <div className="text-base font-bold font-['Montserrat']">
                <Trans>Swap</Trans>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="limit"
              className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex"
            >
              <div className="text-base font-bold font-['Montserrat']">
                <Trans>Limit</Trans>
              </div>
            </TabsTrigger>
            <TabsTrigger
              value="dca"
              className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex"
            >
              <div className="text-base font-bold font-['Montserrat']">
                <Trans>DCA</Trans>
              </div>
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <Outlet />
      </div>
    </div>
  );
}
