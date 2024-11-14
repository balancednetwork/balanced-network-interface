import React from 'react';

import { Trans } from '@lingui/macro';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { MouseoverTooltip } from '@/app/components/Tooltip';
import { DarkAnimateButton } from '@/app/components2/Button/DarkAnimateButton';
import LimitIcon from '@/assets/icons/candle.svg';
import DCAIcon from '@/assets/icons/dca.svg';
import SwapIcon from '@/assets/icons/swap.svg';
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
        <div className="flex gap-2 justify-center">
          <DarkAnimateButton
            Icon={<SwapIcon className="text-[#695682]" />}
            text="Swap"
            showText={!(value === 'swap')}
            onClick={() => handleTabClick('swap')}
          />
          <DarkAnimateButton
            Icon={<LimitIcon className="text-[#695682]" />}
            text="Limit"
            showText={!(value === 'limit')}
            onClick={() => handleTabClick('limit')}
          />
          <DarkAnimateButton
            Icon={<DCAIcon className="text-[#695682]" />}
            text="DCA"
            showText={!(value === 'dca')}
            onClick={() => handleTabClick('dca')}
          />
        </div>

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
