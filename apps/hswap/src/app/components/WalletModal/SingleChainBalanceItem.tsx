import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance, formatValue } from '@/utils/formatter';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XToken } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
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
    <TableRow>
      <TableCell className="font-medium flex items-center gap-2">
        <CurrencyLogoWithNetwork currency={currency} size={isNested ? '20px' : '24px'} />
        <div>{isNested ? xChainMap[currency.xChainId].name : currency.symbol}</div>
      </TableCell>
      <TableCell className="text-right">
        {formatBalance(balance?.toFixed(), rates?.[currency.symbol]?.toFixed())}
      </TableCell>
      <TableCell className="text-right">{!value ? '-' : formatValue(value.toFixed())}</TableCell>
    </TableRow>
  );
};

export default SingleChainBalanceItem;
