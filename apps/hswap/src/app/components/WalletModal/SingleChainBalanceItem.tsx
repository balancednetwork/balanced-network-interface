import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance, formatValue } from '@/utils/formatter';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XToken } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React from 'react';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';

type SingleChainBalanceItemProps = {
  balance: CurrencyAmount<XToken>;
  isLast?: boolean;
  isNested?: boolean;
};

const SingleChainBalanceItem = ({ balance, isLast = false, isNested = false }: SingleChainBalanceItemProps) => {
  const currency = balance.currency;
  const rates = useRatesWithOracle();
  const value = new BigNumber(balance.toFixed()).times(rates?.[currency.symbol] || 0);
  return (
    <>
      <div className="font-medium flex items-center gap-2">
        <CurrencyLogoWithNetwork currency={currency} size={isNested ? '20px' : '24px'} />
        <div>{isNested ? xChainMap[currency.xChainId].name : currency.symbol}</div>
      </div>
      <div className="text-right">{formatBalance(balance?.toFixed(), rates?.[currency.symbol]?.toFixed())}</div>
      <div className="text-right">{!value ? '-' : formatValue(value.toFixed())}</div>
    </>
  );
};

export default SingleChainBalanceItem;
