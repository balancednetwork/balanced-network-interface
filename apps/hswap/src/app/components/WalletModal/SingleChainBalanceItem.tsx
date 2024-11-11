import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { cn } from '@/lib/utils';
import { useRatesWithOracle } from '@/queries/reward';
import { useSwapActionHandlers } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatBalance, formatValue } from '@/utils/formatter';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XToken } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React from 'react';

type SingleChainBalanceItemProps = {
  balance: CurrencyAmount<XToken>;
  isNested?: boolean;
  className?: string;
};

const SingleChainBalanceItem = ({ balance, isNested = false, className = '' }: SingleChainBalanceItemProps) => {
  const currency = balance.currency;
  const rates = useRatesWithOracle();
  const value = new BigNumber(balance.toFixed()).times(rates?.[currency.symbol] || 0);
  const { onCurrencySelection } = useSwapActionHandlers();

  return (
    <div
      className={cn('grid grid-cols-4 items-center cursor-pointer rounded-xl px-10 py-4', className)}
      onClick={() => {
        onCurrencySelection(Field.INPUT, balance.currency);
      }}
    >
      <div className="col-span-2 font-medium flex items-center gap-2">
        <CurrencyLogoWithNetwork currency={currency} size={isNested ? '32px' : '32px'} />
        <div className="text-sm font-bold hover:title-gradient">
          {isNested ? xChainMap[currency.xChainId].name : currency.symbol}
        </div>
      </div>
      <div className="text-right text-sm font-bold">
        {formatBalance(balance?.toFixed(), rates?.[currency.symbol]?.toFixed())}
      </div>
      <div className="text-right text-[#685682] text-sm leading-tight">
        {!value ? '-' : formatValue(value.toFixed())}
      </div>
    </div>
  );
};

export default SingleChainBalanceItem;
