import React, { useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { Validator } from 'icon-sdk-js';
import { forEach } from 'lodash-es';
import { useDispatch, useSelector } from 'react-redux';

import { MINIMUM_ICX_FOR_TX } from '@/constants/index';
import { BIGINT_ZERO } from '@/constants/misc';
import {
  COMBINED_TOKENS_LIST,
  SUPPORTED_TOKENS_LIST,
  SUPPORTED_TOKENS_MAP_BY_ADDRESS,
  isBALN,
  isFIN,
  isNativeCurrency,
} from '@/constants/tokens';
import { useBnJsContractQuery } from '@/queries/utils';
import { useTokenListConfig } from '@/store/lists/hooks';
import { useAllTransactions } from '@/store/transactions/hooks';
import { useUserAddedTokens } from '@/store/user/hooks';
import { getXTokenAddress, isXToken } from '@/utils/xTokens';
import { XToken, XWalletAssetRecord } from '@/xwagmi/types';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

import { AppState } from '..';
import { useAllTokens } from '../../hooks/Tokens';
import { changeBalances, changeICONBalances } from './reducer';

import { useXBalances } from '@/xwagmi/hooks/useXBalances';
import { XChainId } from '@/xwagmi/types';

import { useSignedInWallets } from '@/hooks/useWallets';
import useXTokens from '@/hooks/useXTokens';
import { useRatesWithOracle } from '@/queries/reward';
import { NATIVE_ADDRESS } from '@/xwagmi/constants';
import { SUPPORTED_XCALL_CHAINS } from '@/xwagmi/constants/xChains';
import { useXAccount } from '@/xwagmi/hooks';

export function useCrossChainWalletBalances(): AppState['wallet'] {
  const signedInWallets = useSignedInWallets();
  const balances = useSelector((state: AppState) => state.wallet);

  return useMemo(() => {
    return Object.keys(balances).reduce(
      (acc, xChainId) => {
        if (signedInWallets.some(wallet => wallet.xChainId === xChainId)) {
          acc[xChainId] = balances[xChainId];
        }
        return acc;
      },
      {} as AppState['wallet'],
    );
  }, [balances, signedInWallets]);
}

export function useICONWalletBalances(): { [address: string]: CurrencyAmount<Currency> } {
  return useSelector((state: AppState) => state.wallet['0x1.icon']!);
}

export function useWalletBalances(xChainId: XChainId): { [address: string]: CurrencyAmount<Currency> } | undefined {
  return useSelector((state: AppState) => state.wallet[xChainId]);
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
  React.useEffect(() => {
    dispatch(changeICONBalances(balances));
  }, [balances, dispatch]);

  // fetch balances on havah
  const { address: accountHavah } = useXAccount('HAVAH');
  const havahTokens = useXTokens('0x100.icon') || [];
  const { data: balancesHavah } = useXBalances({
    xChainId: '0x100.icon',
    xTokens: havahTokens,
    address: accountHavah,
  });
  React.useEffect(() => {
    balancesHavah && dispatch(changeBalances({ xChainId: '0x100.icon', balances: balancesHavah }));
  }, [balancesHavah, dispatch]);

  // fetch balances on archway
  const { address: accountArch } = useXAccount('ARCHWAY');
  const tokensArch = useXTokens('archway-1') || [];
  const { data: balancesArch } = useXBalances({
    xChainId: 'archway-1',
    xTokens: [...tokensArch, new XToken('archway-1', 'archway-1', NATIVE_ADDRESS, 18, 'aARCH', 'Arch')],
    address: accountArch,
  });

  React.useEffect(() => {
    balancesArch && dispatch(changeBalances({ xChainId: 'archway-1', balances: balancesArch }));
  }, [balancesArch, dispatch]);

  const { address } = useXAccount('EVM');
  // fetch balances on avax
  const avaxTokens = useXTokens('0xa86a.avax');
  const { data: avaxBalances } = useXBalances({
    xChainId: '0xa86a.avax',
    xTokens: avaxTokens,
    address,
  });
  React.useEffect(() => {
    avaxBalances && dispatch(changeBalances({ xChainId: '0xa86a.avax', balances: avaxBalances }));
  }, [avaxBalances, dispatch]);

  // fetch balances on bsc
  const bscTokens = useXTokens('0x38.bsc');
  const { data: bscBalances } = useXBalances({
    xChainId: '0x38.bsc',
    xTokens: bscTokens,
    address,
  });
  React.useEffect(() => {
    bscBalances && dispatch(changeBalances({ xChainId: '0x38.bsc', balances: bscBalances }));
  }, [bscBalances, dispatch]);

  // fetch balances on arb
  const arbTokens = useXTokens('0xa4b1.arbitrum');
  const { data: arbBalances } = useXBalances({
    xChainId: '0xa4b1.arbitrum',
    xTokens: arbTokens,
    address,
  });
  React.useEffect(() => {
    arbBalances && dispatch(changeBalances({ xChainId: '0xa4b1.arbitrum', balances: arbBalances }));
  }, [arbBalances, dispatch]);

  // fetch balances on base
  const baseTokens = useXTokens('0x2105.base');
  const { data: baseBalances } = useXBalances({
    xChainId: '0x2105.base',
    xTokens: baseTokens,
    address,
  });
  React.useEffect(() => {
    baseBalances && dispatch(changeBalances({ xChainId: '0x2105.base', balances: baseBalances }));
  }, [baseBalances, dispatch]);

  // fetch balances on injective
  const { address: accountInjective } = useXAccount('INJECTIVE');
  const injectiveTokens = useXTokens('injective-1');
  const { data: injectiveBalances } = useXBalances({
    xChainId: 'injective-1',
    xTokens: injectiveTokens,
    address: accountInjective,
  });
  React.useEffect(() => {
    injectiveBalances && dispatch(changeBalances({ xChainId: 'injective-1', balances: injectiveBalances }));
  }, [injectiveBalances, dispatch]);

  const { address: accountSui } = useXAccount('SUI');
  const suiTokens = useXTokens('sui');
  const { data: suiBalances } = useXBalances({
    xChainId: 'sui',
    xTokens: suiTokens,
    address: accountSui,
  });
  React.useEffect(() => {
    suiBalances && dispatch(changeBalances({ xChainId: 'sui', balances: suiBalances }));
  }, [suiBalances, dispatch]);
}

export const useBALNDetails = (): { [key in string]?: BigNumber } => {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const [details, setDetails] = React.useState({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    const fetchDetails = async () => {
      if (account) {
        const result = await bnJs.BALN.detailsBalanceOf(account);

        const temp = {};

        forEach(result, (value, key) => {
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
  const balances = useICONWalletBalances();
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
  const xBalances = useCrossChainWalletBalances();

  return React.useMemo(() => {
    if (!xBalances) return;

    if (selectedChainId) {
      return new BigNumber(xBalances[selectedChainId]?.[currency.wrapped.address]?.toFixed() || 0);
    } else {
      if (isXToken(currency)) {
        return SUPPORTED_XCALL_CHAINS.reduce((sum, xChainId) => {
          if (xBalances[xChainId]) {
            const tokenAddress = getXTokenAddress(xChainId, currency.wrapped.symbol);
            const balance = new BigNumber(xBalances[xChainId]?.[tokenAddress ?? -1]?.toFixed() || 0);
            sum = sum.plus(balance);
          }
          return sum;
        }, new BigNumber(0));
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

export function useCurrencyBalance(account?: string, currency?: Currency): CurrencyAmount<Currency> | undefined {
  return useCurrencyBalances(
    account,
    useMemo(() => [currency], [currency]),
  )[0];
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

  const ICX = SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.ICX.address];

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

export function useLiquidityTokenBalance(account: string | undefined | null, pair: Pair | undefined | null) {
  const query = useBnJsContractQuery<string>('Dex', 'balanceOf', [account, pair?.poolId]);
  const { data } = query;
  return pair && data ? CurrencyAmount.fromRawAmount<Token>(pair.liquidityToken, data) : undefined;
}

export function useXBalancesByToken(): XWalletAssetRecord[] {
  const balances = useCrossChainWalletBalances();
  const tokenListConfig = useTokenListConfig();
  const prices = useRatesWithOracle();

  return React.useMemo(() => {
    return Object.entries(
      Object.entries(balances).reduce(
        (acc, [chainId, chainBalances]) => {
          if (chainBalances) {
            forEach(chainBalances, balance => {
              if (balance.currency && balance?.greaterThan(0)) {
                acc[balance.currency.symbol] = {
                  ...acc[balance.currency.symbol],
                  [chainId]: balance,
                };
              }
            });
          }
          return acc;
        },
        {} as { [AssetSymbol in string]: { [key in XChainId]: CurrencyAmount<Currency> | undefined } },
      ),
    )
      .map(([symbol, xTokenAmounts]) => {
        const baseToken = (tokenListConfig.community ? COMBINED_TOKENS_LIST : SUPPORTED_TOKENS_LIST).find(
          token => token.symbol === symbol,
        );

        if (baseToken === undefined) return;

        const total = Object.values(xTokenAmounts).reduce((sum, xTokenAmount) => {
          if (xTokenAmount) sum = sum.plus(new BigNumber(xTokenAmount.toFixed()));
          return sum;
        }, new BigNumber(0));
        return {
          baseToken,
          xTokenAmounts,
          isBalanceSingleChain: Object.keys(xTokenAmounts).length === 1,
          total,
          value: prices && prices[symbol] ? total.times(prices[symbol]) : undefined,
        };
      })
      .filter((item): item is XWalletAssetRecord => Boolean(item));
  }, [balances, tokenListConfig, prices]);
}
