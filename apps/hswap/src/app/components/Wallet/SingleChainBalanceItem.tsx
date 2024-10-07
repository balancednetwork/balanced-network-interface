import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance, formatValue } from '@/utils/formatter';
import { XToken } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React from 'react';
import CurrencyLogoWithNetwork from '../../components2/CurrencyLogoWithNetwork';

type SingleChainBalanceItemProps = {
  balance: CurrencyAmount<XToken>;
};

const SingleChainBalanceItem = ({ balance }: SingleChainBalanceItemProps) => {
  const currency = balance.currency;
  const rates = useRatesWithOracle();
  const value = new BigNumber(balance.toFixed()).times(rates?.[currency.symbol] || 0);
  return (
    <div className="p-4 bg-[#221542] rounded-xl flex items-center gap-2">
      <CurrencyLogoWithNetwork currency={currency} size="48px" />
      <div className="grow">
        <div className="text-subtitle">{currency.symbol}</div>
        <div className="text-subtitle">
          {formatBalance(balance?.toFixed(), rates?.[currency.symbol]?.toFixed())} USDC
        </div>
      </div>
      <div className="text-right">
        <div className="text-subtitle">{!value ? '-' : formatValue(value.toFixed())}</div>
        <div>{!rates?.[currency.symbol] ? '-' : formatValue(rates?.[currency.symbol].toFixed())}</div>
      </div>
    </div>
  );
};

export default SingleChainBalanceItem;
