import React, { useState, useEffect, useMemo } from 'react';

import { Token, CurrencyAmount, Currency } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';
import { Validator } from 'icon-sdk-js';
import JSBI from 'jsbi';
import _ from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import { CallData } from 'packages/BalancedJs/contracts/Multicall';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { MINIMUM_ICX_FOR_TX } from 'constants/index';
import { BIGINT_ZERO } from 'constants/misc';
import {
  SUPPORTED_TOKENS_LIST,
  isNativeCurrency,
  SUPPORTED_TOKENS_MAP_BY_ADDRESS,
  isBALN,
  isFIN,
} from 'constants/tokens';
import { useBnJsContractQuery } from 'queries/utils';
import { useAllTransactions } from 'store/transactions/hooks';
import { useUserAddedTokens } from 'store/user/hooks';

import { AppState } from '..';
import { useAllTokens } from '../../hooks/Tokens';
import { changeBalances } from './actions';

export function useWalletBalances(): AppState['wallet'] {
  return useSelector((state: AppState) => state.wallet);
}

export function useAvailableBalances(
  account: string | undefined,
  tokens: Token[],
): {
  [key: string]: CurrencyAmount<Currency>;
} {
  const balances = useCurrencyBalances(account || undefined, tokens);

  return React.useMemo(() => {
    return balances.reduce((acc, balance) => {
      if (!balance) return acc;
      if (!JSBI.greaterThan(balance.quotient, BIGINT_ZERO) && balance.currency.wrapped.address !== bnJs.BALN.address) {
        return acc;
      }
      acc[balance.currency.wrapped.address] = balance;

      return acc;
    }, {});
  }, [balances]);
}

export function useWalletFetchBalances(account?: string | null) {
  const dispatch = useDispatch();

  const userAddedTokens = useUserAddedTokens();

  const tokens = useMemo(() => {
    return [...SUPPORTED_TOKENS_LIST, ...userAddedTokens];
  }, [userAddedTokens]);

  const balances = useAvailableBalances(account || undefined, tokens);

  React.useEffect(() => {
    dispatch(changeBalances(balances));
  }, [balances, dispatch]);
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
  const icxAddress = bnJs.ICX.address;
  return balances[icxAddress] && balances[icxAddress].greaterThan(MINIMUM_ICX_FOR_TX);
};

export function useTokenBalances(
  account: string | undefined,
  tokens: Token[],
): { [address: string]: CurrencyAmount<Token> | undefined } {
  const [balances, setBalances] = useState<(string | number | BigNumber)[]>([]);

  const transactions = useAllTransactions();

  useEffect(() => {
    const fetchBalances = async () => {
      if (account) {
        const cds: CallData[] = tokens.map(token => {
          if (isBALN(token))
            return {
              target: bnJs.BALN.address,
              method: 'availableBalanceOf',
              params: [account],
            };
          if (isFIN(token))
            return {
              target: token.address,
              method: 'availableBalanceOf',
              params: [account],
            };

          return {
            target: token.address,
            method: 'balanceOf',
            params: [account],
          };
        });

        const data: any[] = await bnJs.Multicall.getAggregateData(cds);
        const result = data.map(bal => (bal === null ? undefined : bal));

        setBalances(result);
      } else {
        setBalances(Array(tokens.length).fill(undefined));
      }
    };

    if (tokens.length > 0) {
      fetchBalances();
    }
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
