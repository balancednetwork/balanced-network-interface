import React, { useEffect, useMemo } from 'react';
import MultiChainBalanceItem from './MultiChainBalanceItem';
import SingleChainBalanceItem from './SingleChainBalanceItem';
import { BalanceAndValueWrap, DashGrid, HeaderText, List } from './styledComponents';
import { useWalletBalances } from '@/store/wallet/hooks';
import { useRatesWithOracle } from '@/queries/reward';
import { CurrencyAmount, XToken } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';

const XTokenList = () => {
  const _balances = useWalletBalances();
  const balances = useMemo(() => Object.values(_balances), [_balances]);

  const sortedFilteredBalances = useXBalancesByToken(balances);

  return (
    <List>
      <DashGrid>
        <HeaderText>
          <Trans>Asset</Trans>
        </HeaderText>
        <BalanceAndValueWrap>
          <HeaderText>
            <Trans>Balance</Trans>
          </HeaderText>
          <HeaderText className="hidden sm:block">
            <Trans>Value</Trans>
          </HeaderText>
        </BalanceAndValueWrap>
      </DashGrid>
      {Object.values(sortedFilteredBalances).map((balances, index) =>
        balances.length === 1 ? (
          <SingleChainBalanceItem key={index} balance={balances[0]} />
        ) : (
          <MultiChainBalanceItem key={index} balances={balances} />
        ),
      )}
    </List>
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
