import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import useAmountInUSD from '@/hooks/useAmountInUSD';
import { formatBigNumber } from '@/utils';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import { XToken } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import React from 'react';

interface CurrencyCardProps {
  currency: XToken | undefined;
  currencyAmount: CurrencyAmount<Currency> | undefined;
}

const CurrencyCard: React.FC<CurrencyCardProps> = ({ currency, currencyAmount }) => {
  const amountInUSD = useAmountInUSD(currencyAmount);

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-[131px] h-[131px] px-[31px] py-4 bg-[#bbadde] rounded-3xl inline-flex justify-center items-end gap-0">
        <div className="flex flex-col items-center">
          <div>{currency && <CurrencyLogoWithNetwork currency={currency} />}</div>
          <div className="text-title-gradient text-lg font-extrabold leading-tight">
            {formatBigNumber(new BigNumber(currencyAmount?.toFixed() || 0), 'currency')}
          </div>
          <div className="text-[#0d0229] text-[10px] font-medium leading-3">{currency?.symbol}</div>
        </div>
      </div>
      <div className="text-white text-sm font-bold leading-tight">{amountInUSD}</div>
    </div>
  );
};

export default CurrencyCard;
