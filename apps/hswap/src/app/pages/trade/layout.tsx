import React from 'react';

import { Trans } from '@lingui/macro';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useFetchOraclePrices } from '@/store/oracle/hooks';
import { useFetchPrice } from '@/store/ratio/hooks';
import { useFetchStabilityFundBalances } from '@/store/stabilityFund/hooks';
import { useWalletFetchBalances } from '@/store/wallet/hooks';
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { MouseoverTooltip } from '@/app/components/Tooltip';

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
      <div className="flex flex-col mb-10 w-full max-w-[400px]">
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
            {/* <TabsTrigger
              value="limit"
              className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex"
            > */}
            {/* </TabsTrigger> */}
            <div className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex">
              <MouseoverTooltip
                content={<div className="p-2">Coming Soon</div>}
                placement={'top'}
                closeAfterDelay={0}
                zIndex={9999}
              >
                <div className="text-base font-bold font-['Montserrat'] cursor-default">
                  <Trans>Limit</Trans>
                </div>
              </MouseoverTooltip>
            </div>
            <div className="h-9 px-3 py-2 rounded-full justify-center items-center gap-2 inline-flex">
              <MouseoverTooltip
                content={<div className="p-2">Coming Soon</div>}
                placement={'top'}
                closeAfterDelay={0}
                zIndex={9999}
              >
                <div className="text-base font-bold font-['Montserrat'] cursor-default">
                  <Trans>DCA</Trans>
                </div>
              </MouseoverTooltip>
            </div>
          </TabsList>
        </Tabs>
        <Outlet />
      </div>
    </div>
  );
}
