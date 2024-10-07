import React, { useEffect, useMemo } from 'react';

import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';

import { Typography } from '@/app/components2/Typography';
import useKeyPress from '@/hooks/useKeyPress';
import { useWalletModalToggle } from '@/store/application/hooks';
import { useXDisconnectAll } from '@/xwagmi/hooks';

import { useRatesWithOracle } from '@/queries/reward';
import { useWalletBalances } from '@/store/wallet/hooks';
import { CurrencyAmount, XToken } from '@balancednetwork/sdk-core';
import MultiChainBalanceItem from './MultiChainBalanceItem';
import SingleChainBalanceItem from './SingleChainBalanceItem';
import { BalanceAndValueWrap, DashGrid, HeaderText, List } from './styledComponents';
import { Button } from '@/components/ui/button';

interface WalletProps {
  close: () => void;
}

const Wallet = ({ close }: WalletProps) => {
  const _balances = useWalletBalances();
  const balances = useMemo(() => Object.values(_balances), [_balances]);

  const toggleWalletModal = useWalletModalToggle();
  const handleEscape = useKeyPress('Escape');

  const handleChangeWallet = () => {
    close();
    toggleWalletModal();
  };

  const xDisconnectAll = useXDisconnectAll();

  const handleDisconnectWallet = async () => {
    close();
    await xDisconnectAll();
  };

  const sortedFilteredBalances = useXBalancesByToken(balances);

  useEffect(() => {
    if (handleEscape) {
      close();
    }
  }, [handleEscape, close]);

  return (
    <div className="w-[400px] max-w-[calc(100vw - 4px)]">
      <div className="text-sm pt-6 pr-6 pb-4 pl-6 flex flex-wrap justify-end">
        <div className="flex items-center">
          <Button onClick={handleChangeWallet} variant="link">
            <Trans>Manage wallets</Trans>
          </Button>
          <Typography className="p-[0px_5px]">{' | '}</Typography>
          <Button onClick={handleDisconnectWallet} variant="link">
            <Trans>Sign out</Trans>
          </Button>
        </div>
      </div>

      <div className="pt-0 pr-0 pb-6">
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
      </div>
    </div>
  );
};

export default Wallet;

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
