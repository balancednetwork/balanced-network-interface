import React from 'react';

import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { DarkAnimateButton } from '@/app/components2/Button/DarkAnimateButton';
import {
  DCAGradientIcon,
  DCAIcon,
  LimitGradientIcon,
  LimitIcon,
  SwapGradientIcon,
  SwapIcon,
} from '@/app/components2/Icons';
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
      <div className="flex flex-col mb-10 w-full max-w-[400px]">
        <div className="flex gap-2 justify-center">
          <DarkAnimateButton
            Icon={value === 'swap' ? <SwapGradientIcon /> : <SwapIcon />}
            text="Swap"
            showText={!(value === 'swap')}
            onClick={() => handleTabClick('swap')}
          />
          <DarkAnimateButton
            Icon={value === 'limit' ? <LimitGradientIcon /> : <LimitIcon />}
            text="Limit"
            showText={!(value === 'limit')}
            onClick={() => handleTabClick('limit')}
          />
          <DarkAnimateButton
            Icon={value === 'dca' ? <DCAGradientIcon /> : <DCAIcon />}
            text="DCA"
            showText={!(value === 'dca')}
            onClick={() => handleTabClick('dca')}
          />
        </div>
        <Outlet />
      </div>
    </div>
  );
}
