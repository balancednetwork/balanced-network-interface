import { useRatesWithOracle } from '@/queries/reward';
import { formatBalance, formatValue } from '@/utils/formatter';
import { XToken } from '@balancednetwork/sdk-core';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React from 'react';
import SingleChainBalanceItem from './SingleChainBalanceItem';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
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
      <TableRow>
        <TableCell className="font-medium flex items-center gap-2">
          <CurrencyLogo currency={currency} />
          <div>{currency.symbol}</div>
        </TableCell>
        <TableCell className="text-right">
          {formatBalance(total?.toFixed(), rates?.[currency.symbol]?.toFixed())}
        </TableCell>
        <TableCell className="text-right">{!value ? '-' : formatValue(value.toFixed())}</TableCell>
      </TableRow>

      <TableRow>
        <TableCell colSpan={3}>
          <Table>
            <TableBody>
              {balances.map(balance => (
                <SingleChainBalanceItem key={balance.currency.address} balance={balance} />
              ))}
            </TableBody>
          </Table>
        </TableCell>
      </TableRow>
    </>
  );
};

export default MultiChainBalanceItem;
