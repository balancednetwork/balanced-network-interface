import React, { useState, useEffect, useMemo } from 'react';

import { BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Token, CurrencyAmount, Currency } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';
import { Validator } from 'icon-sdk-js';
import { forEach } from 'lodash-es';
import { useIconReact } from 'packages/icon-react';
import { keepPreviousData, useQuery, UseQueryResult } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';

import { ARCHWAY_FEE_TOKEN_SYMBOL } from 'app/_xcall/_icon/config';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useARCH } from 'app/pages/trade/bridge/_config/tokens';
import { isDenomAsset } from 'app/_xcall/archway/utils';
import { XChainId, XWalletAssetRecord } from 'app/pages/trade/bridge/types';
import { getCrossChainTokenAddress, isXToken } from 'app/pages/trade/bridge/utils';
import bnJs from 'bnJs';
import { MINIMUM_ICX_FOR_TX, NATIVE_ADDRESS } from 'constants/index';
import { BIGINT_ZERO } from 'constants/misc';
import {
  SUPPORTED_TOKENS_LIST,
  isNativeCurrency,
  SUPPORTED_TOKENS_MAP_BY_ADDRESS,
  isBALN,
  isFIN,
  COMBINED_TOKENS_LIST,
} from 'constants/tokens';
import { useBnJsContractQuery } from 'queries/utils';
import { useTokenListConfig } from 'store/lists/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useUserAddedTokens } from 'store/user/hooks';

import { AppState } from '..';
import { useAllTokens } from '../../hooks/Tokens';
import { changeBalances, changeICONBalances } from './reducer';

export function useCrossChainWalletBalances(): AppState['wallet'] {
  return useSelector((state: AppState) => state.wallet);
}

export function useICONWalletBalances(): { [address: string]: CurrencyAmount<Currency> } {
  return useSelector((state: AppState) => state.wallet['0x1.icon']!);
}

export function useArchwayWalletBalances(): AppState['wallet']['archway-1'] {
  return useSelector((state: AppState) => state.wallet['archway-1']);
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

export function useArchwayBalances(
  address: string | undefined,
  tokens: Token[],
): UseQueryResult<{
  [key: string]: CurrencyAmount<Currency>;
}> {
  const { signingClient, chain_id } = useArchwayContext();
  const arch = useARCH();

  return useQuery({
    queryKey: [`archwayBalances`, chain_id, address, tokens],
    queryFn: async () => {
      if (!signingClient || !address) return;

      const cw20Tokens = [...tokens].filter(token => !isDenomAsset(token));
      const denoms = [...tokens].filter(token => isDenomAsset(token));

      const cw20Balances = await Promise.all(
        cw20Tokens.map(async token => {
          const balance = await signingClient.queryContractSmart(token.address, { balance: { address } });
          return CurrencyAmount.fromRawAmount(token, balance.balance);
        }),
      );

      const nativeBalances = await Promise.all(
        denoms.map(async token => {
          const nativeBalance = await signingClient.getBalance(address, token.address);
          return CurrencyAmount.fromRawAmount(token, nativeBalance.amount ?? 0);
        }),
      );

      //arch token balance
      const archTokenBalance = await signingClient.getBalance(address, ARCHWAY_FEE_TOKEN_SYMBOL);
      const archBalance = CurrencyAmount.fromRawAmount(arch, archTokenBalance.amount || 0);

      return [archBalance, ...nativeBalances, ...cw20Balances].reduce((acc, balance) => {
        if (!balance) return acc;
        if (!(balance.quotient > BIGINT_ZERO)) {
          return acc;
        }
        acc[balance.currency.wrapped.address] = balance;
        return acc;
      }, {});
    },
    placeholderData: keepPreviousData,
    enabled: Boolean(signingClient && address),
    refetchInterval: 5_000,
  });
}

import { viemClients } from 'config/wagmi';
import { erc20Abi } from 'viem';
import { useAccount, useBalance, usePublicClient } from 'wagmi';
import useXTokens from 'app/pages/trade/bridge/_hooks/useXTokens';
import { SUPPORTED_XCALL_CHAINS, xChainMap } from 'app/pages/trade/bridge/_config/xChains';
import { useRatesWithOracle } from 'queries/reward';

export function useEVMBalances(account: `0x${string}` | undefined, tokens: Token[] | undefined, xChainId: XChainId) {
  const chainId = xChainMap[xChainId].id;
  const { data } = useBalance({ address: account, chainId: chainId as number, query: { refetchInterval: 5_000 } });

  const xChain = xChainMap[xChainId];
  const nativeBalance = useMemo(
    () =>
      data?.value
        ? CurrencyAmount.fromRawAmount(
            new Token(xChain.id, NATIVE_ADDRESS, 18, xChain.nativeCurrency.symbol, xChain.nativeCurrency.name),
            data?.value.toString(),
          )
        : undefined,
    [data, xChain],
  );

  const _tokens = useMemo(() => tokens?.filter(token => token.address !== NATIVE_ADDRESS), [tokens]);
  const client = usePublicClient();
  client?.multicall;
  return useQuery({
    queryKey: [account, _tokens, nativeBalance, chainId],
    queryFn: async () => {
      if (!account || !_tokens || !nativeBalance || !chainId) return;

      const result = await viemClients[chainId].multicall({
        contracts: _tokens.map(token => ({
          abi: erc20Abi,
          address: token.address as `0x${string}`,
          functionName: 'balanceOf',
          args: [account],
          chainId: chainId,
        })),
      });

      return [
        nativeBalance,
        ..._tokens.map((token, index) => CurrencyAmount.fromRawAmount(token, result[index].result?.toString() || '0')),
      ].reduce((acc, balance) => {
        acc[balance.currency.wrapped.address] = balance;
        return acc;
      }, {});
    },
    enabled: Boolean(account && _tokens && nativeBalance),
    refetchInterval: 5_000,
  });
}

export function useWalletFetchBalances(account?: string | null, accountArch?: string | null) {
  const dispatch = useDispatch();
  const tokenListConfig = useTokenListConfig();
  const userAddedTokens = useUserAddedTokens();

  const tokens = useMemo(() => {
    return tokenListConfig.community
      ? [...COMBINED_TOKENS_LIST, ...userAddedTokens]
      : [...SUPPORTED_TOKENS_LIST, ...userAddedTokens];
  }, [userAddedTokens, tokenListConfig]);

  // fetch balances on icon
  const balances = useAvailableBalances(account || undefined, tokens);
  React.useEffect(() => {
    dispatch(changeICONBalances(balances));
  }, [balances, dispatch]);

  // fetch balances on archway
  const tokensArch = useXTokens('archway-1') || [];
  const { data: balancesArch } = useArchwayBalances(accountArch || undefined, tokensArch);
  React.useEffect(() => {
    balancesArch && dispatch(changeBalances({ xChainId: 'archway-1', balances: balancesArch }));
  }, [balancesArch, dispatch]);

  const { address } = useAccount();
  // fetch balances on avax
  const avaxTokens = useXTokens('0xa86a.avax');
  const { data: avaxBalances } = useEVMBalances(address, avaxTokens, '0xa86a.avax');
  React.useEffect(() => {
    avaxBalances && dispatch(changeBalances({ xChainId: '0xa86a.avax', balances: avaxBalances }));
  }, [avaxBalances, dispatch]);

  // fetch balances on bsc
  const bscTokens = useXTokens('0x38.bsc');
  const { data: bscBalances } = useEVMBalances(address, bscTokens, '0x38.bsc');
  React.useEffect(() => {
    bscBalances && dispatch(changeBalances({ xChainId: '0x38.bsc', balances: bscBalances }));
  }, [bscBalances, dispatch]);

  // fetch balances on arb
  const arbTokens = useXTokens('0xa4b1.arbitrum');
  const { data: arbBalances } = useEVMBalances(address, arbTokens, '0xa4b1.arbitrum');
  React.useEffect(() => {
    arbBalances && dispatch(changeBalances({ xChainId: '0xa4b1.arbitrum', balances: arbBalances }));
  }, [arbBalances, dispatch]);

  // fetch balances on base
  const baseTokens = useXTokens('0x2105.base');
  const { data: baseBalances } = useEVMBalances(address, baseTokens, '0x2105.base');
  React.useEffect(() => {
    baseBalances && dispatch(changeBalances({ xChainId: '0x2105.base', balances: baseBalances }));
  }, [baseBalances, dispatch]);
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

export function useCrossChainCurrencyBalances(
  currencies: (Currency | undefined)[],
):
  | ({ [key in XChainId]: CurrencyAmount<Currency> | undefined } | { icon: CurrencyAmount<Currency> | undefined })[]
  | undefined {
  const crossChainBalances = useCrossChainWalletBalances();
  const containsICX: boolean = useMemo(
    () => currencies?.some(currency => isNativeCurrency(currency)) ?? false,
    [currencies],
  );
  const { account } = useIconReact();
  const accounts = useMemo(() => (containsICX ? [account || undefined] : []), [containsICX, account]);
  const icxBalance = useICXBalances(accounts);

  return React.useMemo(() => {
    if (crossChainBalances) {
      return currencies.map(currency => {
        if (account && isNativeCurrency(currency)) return { icon: icxBalance[account] };
        return SUPPORTED_XCALL_CHAINS.reduce(
          (balances, chain) => {
            if (crossChainBalances[chain] && currency) {
              const tokenAddress = getCrossChainTokenAddress(chain, currency.wrapped.symbol);
              const balance: CurrencyAmount<Currency> | undefined = tokenAddress
                ? crossChainBalances[chain]?.[tokenAddress]
                : undefined;
              balances[chain] = balance;
              return balances;
            }
            balances[chain] = undefined;
            return balances;
          },
          {} as { [key in XChainId]: CurrencyAmount<Currency> | undefined },
        );
      });
    }
  }, [crossChainBalances, account, currencies, icxBalance]);
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
            const tokenAddress = getCrossChainTokenAddress(xChainId, currency.wrapped.symbol);
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
  [address: string]: CurrencyAmount<Currency> | undefined;
} {
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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

export function useXBalancesByToken(): XWalletAssetRecord[] {
  const balances = useCrossChainWalletBalances();
  const tokenListConfig = useTokenListConfig();
  const prices = useRatesWithOracle();

  return React.useMemo(() => {
    return Object.entries(
      Object.entries(balances).reduce(
        (acc, [chainId, chainBalances]) => {
          if (chainBalances) {
            forEach(chainBalances, (balance, tokenAddress) => {
              if (balance.currency) {
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
      .map(([symbol, balances]) => {
        const baseToken = (tokenListConfig.community ? COMBINED_TOKENS_LIST : SUPPORTED_TOKENS_LIST).find(
          token => token.symbol === symbol,
        );

        if (baseToken === undefined) return;

        const total = Object.values(balances).reduce((sum, balance) => {
          if (balance) sum = sum.plus(new BigNumber(balance.toFixed()));
          return sum;
        }, new BigNumber(0));
        return {
          baseToken,
          balances,
          isBalanceSingleChain: Object.keys(balances).length === 1,
          total,
          value: prices && prices[symbol] ? total.times(prices[symbol]) : undefined,
        };
      })
      .filter(
        (
          item,
        ): item is {
          baseToken: Token;
          balances: { [key in XChainId]: CurrencyAmount<Currency> | undefined };
          isBalanceSingleChain: boolean;
          total: BigNumber;
          value: BigNumber | undefined;
        } => Boolean(item),
      );
  }, [balances, tokenListConfig, prices]);
}
