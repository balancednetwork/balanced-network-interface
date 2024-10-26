import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
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
};

const SingleChainBalanceItem = ({ balance, isNested = false }: SingleChainBalanceItemProps) => {
  const currency = balance.currency;
  const rates = useRatesWithOracle();
  const value = new BigNumber(balance.toFixed()).times(rates?.[currency.symbol] || 0);
  const { onCurrencySelection } = useSwapActionHandlers();

  return (
    <div
      className="grid grid-cols-3 h-10 items-center hover:bg-accent cursor-pointer rounded-xl px-2"
      onClick={() => {
        onCurrencySelection(Field.INPUT, balance.currency);
      }}
    >
      <div className="font-medium flex items-center gap-2">
        <CurrencyLogoWithNetwork currency={currency} size={isNested ? '20px' : '24px'} />
        <div className="text-body">{isNested ? xChainMap[currency.xChainId].name : currency.symbol}</div>
      </div>
      <div className="text-right">{formatBalance(balance?.toFixed(), rates?.[currency.symbol]?.toFixed())}</div>
      <div className="text-right">{!value ? '-' : formatValue(value.toFixed())}</div>
    </div>
  );
};

export default SingleChainBalanceItem;
