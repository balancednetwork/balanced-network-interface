import React, { useMemo } from 'react';
import SingleChainBalanceItem from './SingleChainBalanceItem';
import { useWalletBalances } from '@/store/wallet/hooks';
import { useRatesWithOracle } from '@/queries/reward';
import { CurrencyAmount, XToken } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { ScrollArea } from '@/components/ui/scroll-area';
import MultiChainBalanceItem from './MultiChainBalanceItem';
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const XTokenList = () => {
  const _balances = useWalletBalances();
  const balances = useMemo(() => Object.values(_balances), [_balances]);

  const sortedFilteredBalances = useXBalancesByToken(balances);

  return (
    <ScrollArea className="h-[528px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="">Assets</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead className="text-right">Value</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Object.values(sortedFilteredBalances).map((balances, index) =>
            balances.length === 1 ? (
              <SingleChainBalanceItem key={index} balance={balances[0]} />
            ) : (
              <MultiChainBalanceItem key={index} balances={balances} />
            ),
          )}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={2}>Total</TableCell>
            <TableCell className="text-right">$2,500.00</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </ScrollArea>
  );
};

export default XTokenList;

function calcUSDValue(balance: string, price: BigNumber) {
  return new BigNumber(balance).times(price);
}

function useXBalancesByToken(balances: CurrencyAmount<XToken>[]) {
  const rates = useRatesWithOracle();

  return React.useMemo(() => {
    const t: { [symbol: string]: { values: CurrencyAmount<XToken>[]; total: BigNumber } } = {};

    // filter out low usd value balances
    balances = balances.filter(balance =>
      calcUSDValue(balance.toFixed(), rates?.[balance.currency.symbol] || new BigNumber(0)).gt(0.01),
    );

    for (const balance of balances) {
      if (!t[balance.currency.symbol]) t[balance.currency.symbol] = { values: [], total: new BigNumber(0) };
      t[balance.currency.symbol].values.push(balance);
      t[balance.currency.symbol].total = t[balance.currency.symbol].total.plus(balance.toFixed());
    }

    // sort by usd value of total
    return Object.entries(t)
      .sort((a, b) => {
        const aPrice = rates?.[a[0]] || new BigNumber(0);
        const bPrice = rates?.[b[0]] || new BigNumber(0);
        return calcUSDValue(b[1].total.toFixed(), bPrice).comparedTo(calcUSDValue(a[1].total.toFixed(), aPrice));
      })
      .reduce(
        (t, [symbol, { values, total }]) => {
          t[symbol] = values;
          return t;
        },
        {} as { [symbol: string]: CurrencyAmount<XToken>[] },
      );
  }, [balances, rates]);
}
