import React, { RefObject, useEffect, useMemo, useRef, useState } from 'react';

import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { isMobile } from 'react-device-detect';

import { Typography } from '@/app/theme';
import useKeyPress from '@/hooks/useKeyPress';
import { useWalletModalToggle } from '@/store/application/hooks';
import { formatValue } from '@/utils/formatter';
import { useXDisconnectAll } from '@/xwagmi/hooks';

import { useRatesWithOracle } from '@/queries/reward';
import { useWalletBalances } from '@/store/wallet/hooks';
import { CurrencyAmount, XToken } from '@balancednetwork/sdk-core';
import { Link } from '../Link';
import SearchInput from '../SearchModal/SearchInput';
import MultiChainBalanceItem from './MultiChainBalanceItem';
import SingleChainBalanceItem from './SingleChainBalanceItem';
import { BalanceAndValueWrap, DashGrid, HeaderText, List } from './styledComponents';

interface WalletProps {
  close: () => void;
}

const Wallet = ({ close }: WalletProps) => {
  const _balances = useWalletBalances();
  const balances = useMemo(() => Object.values(_balances), [_balances]);

  const toggleWalletModal = useWalletModalToggle();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>();
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

  const handleSearchQuery = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
  };

  const sortedFilteredBalances = useXBalancesByToken(balances);

  useEffect(() => {
    if (handleEscape) {
      close();
    }
  }, [handleEscape, close]);

  const rates = useRatesWithOracle();
  const walletTotal = React.useMemo(() => {
    return balances.reduce((sum, balance) => {
      sum = sum.plus(new BigNumber(balance.toFixed()).times(rates?.[balance.currency.symbol] || 0));
      return sum;
    }, new BigNumber(0));
  }, [balances, rates]);

  return (
    <div className="w-[400px] max-w-[calc(100vw - 4px)]">
      <div className="text-sm pt-6 pr-6 pb-4 pl-6 flex flex-wrap">
        <Typography variant="h2" mr={'auto'}>
          <Trans>Wallet</Trans>
        </Typography>

        <div className="flex items-center">
          <Link className="cursor-pointer" onClick={handleChangeWallet}>
            <Trans>Manage wallets</Trans>
          </Link>
          <Typography padding={'0px 5px'}>{' | '}</Typography>
          <Link className="cursor-pointer" onClick={handleDisconnectWallet}>
            <Trans>Sign out</Trans>
          </Link>
        </div>
      </div>

      <div className="pt-0 pr-0 pb-6">
        <div className="px-6 mb-4">
          <SearchInput
            type="text"
            id="token-search-input"
            placeholder={t`Search assets and blockchains...`}
            autoComplete="off"
            value={searchQuery}
            ref={inputRef as RefObject<HTMLInputElement>}
            tabIndex={isMobile ? -1 : 1}
            onChange={handleSearchQuery}
          />
        </div>
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
          {Object.keys(sortedFilteredBalances).length === 0 && searchQuery !== '' && (
            <Typography padding={'30px 0 15px 0'} textAlign={'center'}>
              No assets found
            </Typography>
          )}
        </List>

        {Object.keys(sortedFilteredBalances).length > 0 && (
          <div className="px-6">
            <div className="border-top pt-6 flex justify-between">
              <HeaderText>Total</HeaderText>
              <Typography fontWeight="bold" color="text">
                {formatValue(walletTotal.toFixed())}
              </Typography>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;

function calcUSDValue(balance: string, price: BigNumber) {
  return new BigNumber(balance).times(price);
}

export function useXBalancesByToken(balances: CurrencyAmount<XToken>[]) {
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
