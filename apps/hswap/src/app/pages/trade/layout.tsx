import React from 'react';

import { Outlet, useLocation, useNavigate } from 'react-router-dom';

import { DarkAnimateButton } from '@/app/components2/Button/DarkAnimateButton';
import LimitIcon from '@/assets/icons/candle.svg';
import DCAIcon from '@/assets/icons/dca.svg';
import SwapIcon from '@/assets/icons/swap.svg';
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
        <Outlet />
      </div>
    </div>
  );
}
