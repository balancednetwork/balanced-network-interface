import { useRatesWithOracle } from '@/queries/reward';
import { useWalletBalances } from '@/store/wallet/hooks';
import { formatValue } from '@/utils/formatter';
import { CurrencyAmount, XToken } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import React, { useMemo } from 'react';
import MultiChainBalanceItem from './MultiChainBalanceItem';
import SingleChainBalanceItem from './SingleChainBalanceItem';

const XTokenList = () => {
  const _balances = useWalletBalances();
  const balances = useMemo(() => Object.values(_balances), [_balances]);

  const sortedFilteredBalances = useXBalancesByToken(balances);

  // calculate total
  const rates = useRatesWithOracle();
  const walletTotal = React.useMemo(() => {
    return balances.reduce((sum, balance) => {
      sum = sum.plus(new BigNumber(balance.toFixed()).times(rates?.[balance.currency.symbol] || 0));
      return sum;
    }, new BigNumber(0));
  }, [balances, rates]);

  return (
    <>
      <div className="cursor-default flex flex-col gap-1">
        <div className="grid grid-cols-3 h-10 items-center px-2">
          <div className="">Assets</div>
          <div className="text-right">Balance</div>
          <div className="text-right">Value</div>
        </div>

        <>
          {Object.values(sortedFilteredBalances).map((balances, index) =>
            balances.length === 1 ? (
              <SingleChainBalanceItem key={index} balance={balances[0]} />
            ) : (
              <MultiChainBalanceItem key={index} balances={balances} />
            ),
          )}
        </>
      </div>
      {Object.keys(sortedFilteredBalances).length > 0 && (
        <div className="pt-4 px-2 flex justify-between">
          <div className="text-subtitle">Total</div>
          <div className="font-bold">{formatValue(walletTotal.toFixed())}</div>
        </div>
      )}
    </>
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
