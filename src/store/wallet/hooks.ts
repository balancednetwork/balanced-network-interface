import React, { useState, useEffect, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { Validator } from 'icon-sdk-js';
import _ from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import IRC2 from 'packages/BalancedJs/contracts/IRC2';
import ContractSettings from 'packages/BalancedJs/contractSettings';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { MINIMUM_ICX_FOR_TX } from 'constants/index';
import {
  SUPPORTED_TOKENS_LIST,
  isNativeCurrency,
  SUPPORTED_TOKENS_MAP_BY_ADDRESS,
  isBALN,
  isFIN,
} from 'constants/tokens';
import { useBnJsContractQuery } from 'queries/utils';
import { useAllTransactions } from 'store/transactions/hooks';
import { Token, CurrencyAmount, Currency } from 'types/balanced-sdk-core';
import { Pair } from 'types/balanced-v1-sdk';

import { AppState } from '..';
import { useAllTokens } from '../../hooks/Tokens';
import { changeBalances, resetBalances } from './actions';

const contractSettings = new ContractSettings({ networkId: NETWORK_ID });

export function useWalletBalances(): AppState['wallet'] {
  return useSelector((state: AppState) => state.wallet);
}

export function useWalletFetchBalances(account?: string | null) {
  const dispatch = useDispatch();
  const details = useBALNDetails();
  const availableBALN: BigNumber = React.useMemo(() => details['Available balance'] || new BigNumber(0), [details]);

  const transactions = useAllTransactions();

  React.useEffect(() => {
    const fetchBalances = async () => {
      if (account) {
        const list = SUPPORTED_TOKENS_LIST;

        const results = await Promise.all(
          SUPPORTED_TOKENS_LIST.map(token => {
            if (token.symbol === 'ICX') {
              return bnJs.ICX.balanceOf(account);
            } else {
              return new IRC2(contractSettings, token.address).balanceOf(account);
            }
          }),
        );

        const data = results.reduce((prev, result, index) => {
          const symbol = list[index].symbol || 'ERR';

          prev[symbol] = BalancedJs.utils.toIcx(result, symbol);
          if (symbol === 'BALN') {
            prev[symbol] = availableBALN;
          }
          return prev;
        }, {});
        dispatch(changeBalances(data));
      } else {
        dispatch(resetBalances());
      }
    };

    fetchBalances();
  }, [transactions, account, availableBALN, dispatch]);
}

export const useBALNDetails = (): { [key in string]?: BigNumber } => {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const [details, setDetails] = React.useState({});

  React.useEffect(() => {
    const fetchDetails = async () => {
      if (account) {
        const result = await bnJs.BALN.detailsBalanceOf(account);

        const temp = {};

        _.forEach(result, function (value, key) {
          if (key === 'Unstaking time (in microseconds)') temp[key] = new BigNumber(value);
          else temp[key] = BalancedJs.utils.toIcx(value);
        });

        setDetails(temp);
      }
    };

    fetchDetails();
  }, [account, transactions]);

  return details;
};

export const useHasEnoughICX = () => {
  const balances = useWalletBalances();
  return balances['ICX'].isGreaterThan(MINIMUM_ICX_FOR_TX);
};

export function useTokenBalances(
  account: string | undefined,
  tokens: Token[],
): { [address: string]: CurrencyAmount<Token> | undefined } {
  const [balances, setBalances] = useState<(string | number | BigNumber)[]>([]);

  const transactions = useAllTransactions();

  useEffect(() => {
    const fetchBalances = async () => {
      const result = await Promise.all(
        tokens.map(async token => {
          if (!account) return undefined;
          if (isBALN(token)) return bnJs.BALN.availableBalanceOf(account);
          if (isFIN(token)) return bnJs.getContract(token.address).availableBalanceOf(account);
          return bnJs.getContract(token.address).balanceOf(account);
        }),
      );

      setBalances(result);
    };

    fetchBalances();
  }, [transactions, tokens, account]);

  return useMemo(() => {
    return tokens.reduce((agg, token, idx) => {
      const balance = balances[idx];

      if (balance) agg[token.address] = CurrencyAmount.fromRawAmount(token, String(balance));
      else agg[token.address] = CurrencyAmount.fromRawAmount(token, 0);

      return agg;
    }, {});
  }, [balances, tokens]);
}

export function useAllTokenBalances(
  account: string | undefined | null,
): { [tokenAddress: string]: CurrencyAmount<Token> | undefined } {
  const allTokens = useAllTokens();
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens]);
  const balances = useTokenBalances(account ?? undefined, allTokensArray);
  return balances ?? {};
}

export function useCurrencyBalances(
  account: string | undefined,
  currencies: (Currency | undefined)[],
): (CurrencyAmount<Currency> | undefined)[] {
  const tokens = useMemo(
    () =>
      (currencies?.filter((currency): currency is Token => currency?.isToken ?? false) ?? []).filter(
        (token: Token) => !isNativeCurrency(token),
      ),
    [currencies],
  );

  const tokenBalances = useTokenBalances(account, tokens);

  const containsICX: boolean = useMemo(() => currencies?.some(currency => isNativeCurrency(currency)) ?? false, [
    currencies,
  ]);
  const accounts = useMemo(() => (containsICX ? [account] : []), [containsICX, account]);
  const icxBalance = useICXBalances(accounts);

  return React.useMemo(
    () =>
      currencies.map(currency => {
        if (!account || !currency) return undefined;
        if (isNativeCurrency(currency)) return icxBalance[account];
        if (currency.isToken) return tokenBalances[currency.address];
        return undefined;
      }),
    [currencies, tokenBalances, icxBalance, account],
  );
}

export function useCurrencyBalance(account?: string, currency?: Currency): CurrencyAmount<Currency> | undefined {
  return useCurrencyBalances(
    account,
    useMemo(() => [currency], [currency]),
  )[0];
}

export function useICXBalances(
  uncheckedAddresses: (string | undefined)[],
): { [address: string]: CurrencyAmount<Currency> | undefined } {
  const [balances, setBalances] = useState<string[]>([]);

  const transactions = useAllTransactions();

  const addresses: string[] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
            .filter(Validator.isAddress)
            .filter((a): a is string => a !== undefined)
            .sort()
        : [],
    [uncheckedAddresses],
  );

  useEffect(() => {
    const fetchBalances = async () => {
      const result = await Promise.all(
        addresses.map(async address => {
          return bnJs.ICX.balanceOf(address).then(res => res.toFixed());
        }),
      );

      setBalances(result);
    };

    fetchBalances();
  }, [transactions, addresses]);

  const ICX = SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.ICX.address];

  return useMemo(() => {
    return addresses.reduce((agg, address, idx) => {
      const balance = balances[idx];

      if (balance) agg[address] = CurrencyAmount.fromRawAmount(ICX, balance);
      else agg[address] = CurrencyAmount.fromRawAmount(ICX, 0);

      return agg;
    }, {});
  }, [balances, addresses, ICX]);
}

export function useLiquidityTokenBalance(account: string | undefined | null, pair: Pair | undefined | null) {
  const query = useBnJsContractQuery<string>('Dex', 'balanceOf', [account, pair?.poolId]);
  const { data } = query;
  return pair && data ? CurrencyAmount.fromRawAmount<Token>(pair.liquidityToken, data) : undefined;
}
