import React, { useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Token, XToken } from '@balancednetwork/sdk-core';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { Validator } from 'icon-sdk-js';
import { useDispatch, useSelector } from 'react-redux';

import { MINIMUM_ICX_FOR_TX } from '@/constants/index';
import { BIGINT_ZERO } from '@/constants/misc';
import {
  COMBINED_TOKENS_LIST,
  NULL_CONTRACT_ADDRESS,
  SUPPORTED_TOKENS_LIST,
  SUPPORTED_TOKENS_MAP_BY_ADDRESS,
  isBALN,
  isFIN,
  isNativeCurrency,
} from '@/constants/tokens';
import { useTokenListConfig } from '@/store/lists/hooks';
import { useUserAddedTokens } from '@/store/user/hooks';
import { isXToken } from '@/utils/xTokens';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

import { AppState } from '..';
import { useAllTokens } from '../../hooks/Tokens';
import { TokenAmountMap, changeBalances } from './reducer';

import { useXBalances } from '@/xwagmi/hooks/useXBalances';
import { XChainId } from '@balancednetwork/sdk-core';

import useXTokens from '@/hooks/useXTokens';
import { useXAccount } from '@/xwagmi/hooks';

export function useWalletBalances() {
  const wallet = useSelector((state: AppState) => state.wallet);
  const balances = wallet.balances;

  return useMemo(() => {
    return Object.values(balances).reduce((acc, balance) => ({ ...acc, ...balance }), {} as TokenAmountMap);
  }, [balances]);
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
      if (!(balance.quotient > BIGINT_ZERO) && balance.currency.wrapped.address !== bnJs.BALN.address) {
        return acc;
      }
      acc[balance.currency.wrapped.address] = balance;

      return acc;
    }, {});
  }, [balances]);
}

export function useWalletFetchBalances() {
  const dispatch = useDispatch();
  const tokenListConfig = useTokenListConfig();
  const userAddedTokens = useUserAddedTokens();

  const tokens = useMemo(() => {
    return tokenListConfig.community
      ? [...COMBINED_TOKENS_LIST, ...userAddedTokens]
      : [...SUPPORTED_TOKENS_LIST, ...userAddedTokens];
  }, [userAddedTokens, tokenListConfig]);

  // fetch balances on icon
  const { account } = useIconReact();
  const balances = useAvailableBalances(account || undefined, tokens);
  //convert balances to {[key: string]: CurrencyAmount<XToken>}
  const xBalances = React.useMemo(() => {
    return Object.entries(balances).reduce(
      (acc, [address, balance]) => {
        const currency = balance.currency as Token;
        acc[address] = CurrencyAmount.fromRawAmount(
          new XToken(
            '0x1.icon',
            currency.chainId,
            currency.address,
            balance.currency.decimals,
            balance.currency.symbol,
          ),
          balance.quotient.toString(),
        );
        return acc;
      },
      {} as { [key: string]: CurrencyAmount<XToken> },
    );
  }, [balances]);

  React.useEffect(() => {
    dispatch(changeBalances({ xChainType: 'ICON', account: account, balances: xBalances }));
  }, [xBalances, dispatch, account]);

  // fetch balances on havah
  const { address: accountHavah } = useXAccount('HAVAH');
  const havahTokens = useXTokens('0x100.icon') || [];
  const { data: balancesHavah } = useXBalances({
    xChainId: '0x100.icon',
    xTokens: havahTokens,
    address: accountHavah,
  });
  React.useEffect(() => {
    balancesHavah && dispatch(changeBalances({ xChainType: 'HAVAH', account: accountHavah, balances: balancesHavah }));
  }, [balancesHavah, dispatch, accountHavah]);

  // fetch balances on archway
  const { address: accountArch } = useXAccount('ARCHWAY');
  const tokensArch = useXTokens('archway-1') || [];
  const { data: balancesArch } = useXBalances({
    xChainId: 'archway-1',
    xTokens: tokensArch,
    address: accountArch,
  });

  React.useEffect(() => {
    balancesArch && dispatch(changeBalances({ xChainType: 'ARCHWAY', account: accountArch, balances: balancesArch }));
  }, [balancesArch, dispatch, accountArch]);

  const { address } = useXAccount('EVM');
  // fetch balances on avax
  const avaxTokens = useXTokens('0xa86a.avax');
  const { data: avaxBalances } = useXBalances({
    xChainId: '0xa86a.avax',
    xTokens: avaxTokens,
    address,
  });
  React.useEffect(() => {
    avaxBalances && dispatch(changeBalances({ xChainType: 'EVM', account: address, balances: avaxBalances }));
  }, [avaxBalances, dispatch, address]);

  // fetch balances on bsc
  const bscTokens = useXTokens('0x38.bsc');
  const { data: bscBalances } = useXBalances({
    xChainId: '0x38.bsc',
    xTokens: bscTokens,
    address,
  });
  React.useEffect(() => {
    bscBalances && dispatch(changeBalances({ xChainType: 'EVM', account: address, balances: bscBalances }));
  }, [bscBalances, dispatch, address]);

  // fetch balances on arb
  const arbTokens = useXTokens('0xa4b1.arbitrum');
  const { data: arbBalances } = useXBalances({
    xChainId: '0xa4b1.arbitrum',
    xTokens: arbTokens,
    address,
  });
  React.useEffect(() => {
    arbBalances && dispatch(changeBalances({ xChainType: 'EVM', account: address, balances: arbBalances }));
  }, [arbBalances, dispatch, address]);

  // fetch balances on base
  const baseTokens = useXTokens('0x2105.base');
  const { data: baseBalances } = useXBalances({
    xChainId: '0x2105.base',
    xTokens: baseTokens,
    address,
  });
  React.useEffect(() => {
    baseBalances && dispatch(changeBalances({ xChainType: 'EVM', account: address, balances: baseBalances }));
  }, [baseBalances, dispatch, address]);

  // fetch balances on injective
  const { address: accountInjective } = useXAccount('INJECTIVE');
  const injectiveTokens = useXTokens('injective-1');
  const { data: injectiveBalances } = useXBalances({
    xChainId: 'injective-1',
    xTokens: injectiveTokens,
    address: accountInjective,
  });
  React.useEffect(() => {
    injectiveBalances &&
      dispatch(changeBalances({ xChainType: 'INJECTIVE', account: address, balances: injectiveBalances }));
  }, [injectiveBalances, dispatch, address]);

  const { address: accountSui } = useXAccount('SUI');
  const suiTokens = useXTokens('sui');
  const { data: suiBalances } = useXBalances({
    xChainId: 'sui',
    xTokens: suiTokens,
    address: accountSui,
  });
  React.useEffect(() => {
    suiBalances && dispatch(changeBalances({ xChainType: 'SUI', account: accountSui, balances: suiBalances }));
  }, [suiBalances, dispatch, accountSui]);
}

export const useHasEnoughICX = () => {
  const balances = useWalletBalances();
  const icxAddress = bnJs.ICX.address;
  return balances[icxAddress] && balances[icxAddress].greaterThan(MINIMUM_ICX_FOR_TX);
};

export function useTokenBalances(
  account: string | undefined,
  tokens: Token[],
): { [address: string]: CurrencyAmount<Token> | undefined } {
  const { data } = useQuery<{ [address: string]: CurrencyAmount<Token> } | undefined>({
    queryKey: [account, tokens],
    queryFn: async () => {
      if (!account) return;
      if (tokens.length === 0) return;

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

      const data: any[] = await bnJs.Multicall.getAggregateData(cds.filter(cd => cd.target.startsWith('cx')));

      return tokens.reduce((agg, token, idx) => {
        const balance = data[idx];

        if (balance) agg[token.address] = CurrencyAmount.fromRawAmount(token, String(balance));
        else agg[token.address] = CurrencyAmount.fromRawAmount(token, 0);

        return agg;
      }, {});
    },
    enabled: Boolean(account && tokens && tokens.length > 0),
    refetchInterval: 5_000,
  });

  return useMemo(() => data || {}, [data]);
}

export const calculateTotalBalance = (balances: TokenAmountMap, currency: Currency): BigNumber | undefined => {
  return Object.values(balances)
    .filter(balance => balance.currency.symbol === currency.symbol)
    .reduce((sum, balance) => {
      return sum.plus(new BigNumber(balance.toFixed()));
    }, new BigNumber(0));
};

export function useAllTokenBalances(account: string | undefined | null): {
  [tokenAddress: string]: CurrencyAmount<Token> | undefined;
} {
  const allTokens = useAllTokens();
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens]);
  const balances = useTokenBalances(account ?? undefined, allTokensArray);
  return balances ?? {};
}

export const useXCurrencyBalance = (
  currency: Currency,
  selectedChainId: XChainId | undefined,
): BigNumber | undefined => {
  const xBalances = useWalletBalances();

  return React.useMemo(() => {
    if (!xBalances) return;

    if (selectedChainId) {
      return new BigNumber(xBalances[selectedChainId]?.[currency.wrapped.address]?.toFixed() || 0);
    } else {
      if (isXToken(currency)) {
        return calculateTotalBalance(xBalances, currency);
      } else {
        return new BigNumber(xBalances['0x1.icon']?.[currency.wrapped.address]?.toFixed() || 0);
      }
    }
  }, [xBalances, currency, selectedChainId]);
};

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

  const containsICX: boolean = useMemo(
    () => currencies?.some(currency => isNativeCurrency(currency)) ?? false,
    [currencies],
  );

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

export function useICXBalances(uncheckedAddresses: (string | undefined)[]): {
  [address: string]: CurrencyAmount<Currency>;
} {
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

  const ICX = SUPPORTED_TOKENS_MAP_BY_ADDRESS[NULL_CONTRACT_ADDRESS];

  const { data } = useQuery({
    queryKey: ['ICXBalances', addresses],
    queryFn: async () => {
      const balances = await Promise.all(
        addresses.map(async address => {
          return bnJs.ICX.balanceOf(address).then(res => res.toFixed());
        }),
      );

      return addresses.reduce(
        (agg, address, idx) => {
          const balance = balances[idx];

          if (balance) agg[address] = CurrencyAmount.fromRawAmount(ICX, balance);
          else agg[address] = CurrencyAmount.fromRawAmount(ICX, 0);

          return agg;
        },
        {} as { [address: string]: CurrencyAmount<Currency> },
      );
    },
    refetchInterval: 5_000,
  });

  return useMemo(() => data || {}, [data]);
}
