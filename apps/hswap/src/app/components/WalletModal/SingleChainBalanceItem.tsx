import CurrencyLogoWithNetwork from '@/app/components/CurrencyLogoWithNetwork';
import { cn } from '@/lib/utils';
import { useRatesWithOracle } from '@/queries/reward';
import { useSwapActionHandlers } from '@/store/swap/hooks';
import { Field } from '@/store/swap/reducer';
import { formatBalance, formatValue } from '@/utils/formatter';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { xChainMap } from '@balancednetwork/xwagmi';
import { XToken } from '@balancednetwork/xwagmi';
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
      className={cn('grid grid-cols-4 items-center cursor-pointer rounded-xl px-10', className)}
      onClick={() => {
        onCurrencySelection(Field.INPUT, balance.currency);
      }}
    >
      <div className="col-span-2 font-medium flex items-center gap-2">
        <CurrencyLogoWithNetwork currency={currency} className={cn(isNested ? 'w-8 h-8' : '')} />
        <div
          className={cn(
            'text-[#0d0229] text-sm font-bold hover:text-title-gradient leading-tight',
            isNested ? 'text-xs' : '',
          )}
        >
          {isNested ? `on ${xChainMap[currency.xChainId].name}` : currency.symbol}
        </div>
      </div>
      <div className={cn('text-right text-[#0d0229] text-sm font-bold leading-tight', isNested ? 'text-xs' : '')}>
        {formatBalance(balance?.toFixed(), rates?.[currency.symbol]?.toFixed())}
      </div>
      <div className={cn('text-right text-[#685682] text-sm font-medium leading-tight', isNested ? 'text-xs' : '')}>
        {!value ? '-' : formatValue(value.toFixed())}
      </div>
    </div>
  );
};

export default SingleChainBalanceItem;
