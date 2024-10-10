import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance, formatValue } from '@/utils/formatter';
import { XToken } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React from 'react';
import SingleChainBalanceItem from './SingleChainBalanceItem';
import CurrencyLogo from '@/app/components2/CurrencyLogo';

type MultiChainBalanceItemProps = {
  balances: CurrencyAmount<XToken>[];
};

const MultiChainBalanceItem = ({ balances }: MultiChainBalanceItemProps) => {
  const currency = balances[0].currency;
  const rates = useRatesWithOracle();

  const total = balances.reduce((acc, balance) => acc.plus(new BigNumber(balance.toFixed())), new BigNumber(0));
  const value = total.times(rates?.[currency.symbol] || '0');

  return (
    <>
      <div className="font-medium flex items-center gap-2">
        <CurrencyLogo currency={currency} />
        <div>{currency.symbol}</div>
      </div>
      <div className="text-right">{formatBalance(total?.toFixed(), rates?.[currency.symbol]?.toFixed())}</div>
      <div className="text-right">{!value ? '-' : formatValue(value.toFixed())}</div>

      <div className="relative col-span-3 grid grid-cols-3 gap-4 bg-[#221542] p-3 rounded-xl">
        {balances.map(balance => (
          <SingleChainBalanceItem key={balance.currency.address} balance={balance} isNested={true} />
        ))}
        <div className="absolute left-[48px] transform -translate-x-1/2 top-[-10px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-b-[10px] border-[#221542]"></div>
      </div>
    </>
  );
};

export default MultiChainBalanceItem;
