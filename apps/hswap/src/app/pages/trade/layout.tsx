import React from 'react';

import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { DarkAnimateButton } from '@/app/components2/Button/DarkAnimateButton';
import {
  DCAGradientIcon,
  DCAIcon,
  LimitGradientIcon,
  LimitIcon,
  SubtractIcon,
  SwapGradientIcon,
  SwapIcon,
} from '@/app/components2/Icons';
import { useFetchOraclePrices } from '@/store/oracle/hooks';
import { useFetchPrice } from '@/store/ratio/hooks';
import { useFetchStabilityFundBalances } from '@/store/stabilityFund/hooks';
import { useWalletFetchBalances } from '@/store/wallet/hooks';

const AbsoluteSubtractIcon = () => (
  <div className="absolute bottom-[-24px] left-[50%] mx-[-32px]">
    <SubtractIcon className="fill-[rgba(105,86,130,0.3)]" />
  </div>
);

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
      <div className="flex flex-col mb-10 w-full max-w-[400px] gap-6">
        <div className="flex gap-2 justify-center">
          <div className="relative">
            <DarkAnimateButton
              Icon={value === 'swap' ? <SwapGradientIcon /> : <SwapIcon />}
              text="Swap"
              showText={!(value === 'swap')}
              onClick={() => handleTabClick('swap')}
            />
            {value === 'swap' && <AbsoluteSubtractIcon />}
          </div>
          <div className="relative">
            <DarkAnimateButton
              Icon={value === 'limit' ? <LimitGradientIcon /> : <LimitIcon />}
              text="Limit"
              showText={!(value === 'limit')}
              onClick={() => handleTabClick('limit')}
            />
            {value === 'limit' && <AbsoluteSubtractIcon />}
          </div>
          <div className="relative">
            <DarkAnimateButton
              Icon={value === 'dca' ? <DCAGradientIcon /> : <DCAIcon />}
              text="DCA"
              showText={!(value === 'dca')}
              onClick={() => handleTabClick('dca')}
            />
            {value === 'dca' && <AbsoluteSubtractIcon />}
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
