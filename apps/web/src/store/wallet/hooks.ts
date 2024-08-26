import React, { useState, useEffect, useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { Validator } from 'icon-sdk-js';
import { forEach } from 'lodash-es';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from '@/bnJs';
import { MINIMUM_ICX_FOR_TX, NATIVE_ADDRESS } from '@/constants/index';
import { BIGINT_ZERO } from '@/constants/misc';
import {
  COMBINED_TOKENS_LIST,
  SUPPORTED_TOKENS_LIST,
  SUPPORTED_TOKENS_MAP_BY_ADDRESS,
  isBALN,
  isFIN,
  isNativeCurrency,
} from '@/constants/tokens';
import { ARCHWAY_FEE_TOKEN_SYMBOL, useARCH } from '@/constants/tokens1';
import { useBnJsContractQuery } from '@/queries/utils';
import { useTokenListConfig } from '@/store/lists/hooks';
import { useAllTransactions } from '@/store/transactions/hooks';
import { useUserAddedTokens } from '@/store/user/hooks';
import { XChainId, XWalletAssetRecord } from '@/types';
import { getXTokenAddress, isXToken } from '@/utils/xTokens';
import { isDenomAsset } from '@/xwagmi/xchains/archway/utils';

import { AppState } from '..';
import { useAllTokens } from '../../hooks/Tokens';
import { changeBalances, changeICONBalances } from './reducer';

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
  const archwayXService: ArchwayXService = useXService('ARCHWAY') as ArchwayXService;
  // TODO: why use walletClient, not publicClient?
  const signingClient = archwayXService.walletClient;
  const chainId = archwayXService.chainId;

  const arch = useARCH();

  return useQuery({
    queryKey: [`archwayBalances`, chainId, address, tokens],
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

import { viemClients } from '@/config/wagmi';
import { SUPPORTED_XCALL_CHAINS, injective, xChainMap } from '@/constants/xChains';
import { useSignedInWallets } from '@/hooks/useWallets';
import useXTokens from '@/hooks/useXTokens';
import { useRatesWithOracle } from '@/queries/reward';
import { useXAccount, useXService } from '@/xwagmi/hooks';
import { ArchwayXService } from '@/xwagmi/xchains/archway';
import { havahJs } from '@/xwagmi/xchains/havah/havahJs';
import { erc20Abi } from 'viem';
import { useAccount, useBalance, usePublicClient } from 'wagmi';

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
  const { data: balancesHavah } = useHavahBalances(accountHavah || undefined, havahTokens);
  React.useEffect(() => {
    balancesHavah && dispatch(changeBalances({ xChainId: '0x100.icon', balances: balancesHavah }));
  }, [balancesHavah, dispatch]);

  // fetch balances on archway
  const { address: accountArch } = useXAccount('ARCHWAY');
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

  // fetch balances on injective
  const { address: accountInjective } = useXAccount('INJECTIVE');
  const injectiveTokens = useXTokens('injective-1');
  const { data: injectiveBalances } = useInjectiveBalances(accountInjective, injectiveTokens);
  React.useEffect(() => {
    injectiveBalances && dispatch(changeBalances({ xChainId: 'injective-1', balances: injectiveBalances }));
  }, [injectiveBalances, dispatch]);
}

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

export function useHavahBalances(
  address: string | undefined,
  tokens: Token[],
): UseQueryResult<{
  [key: string]: CurrencyAmount<Currency>;
}> {
  return useQuery({
    queryKey: [`havahBalances`, address, tokens],
    queryFn: async () => {
      if (!address) return {};

      const hasNative = tokens.some(token => token.symbol === 'HVH');
      if (!hasNative) return {};

      const HVH = tokens.find(token => token.symbol === 'HVH');
      if (!HVH) return {};

      const promises = tokens.map(token => {
        if (token.symbol === 'HVH')
          return havahJs.ICX.balanceOf(address).then(res => CurrencyAmount.fromRawAmount(HVH, res.toFixed()));

        return havahJs[token.symbol]
          .balanceOf(address)
          .then(res => CurrencyAmount.fromRawAmount(token, res.toString()));
      });

      const rawAmountBalances = await Promise.all(promises);

      const balances = rawAmountBalances.reduce((acc, balance) => {
        if (!balance) return acc;
        if (!(balance.quotient > BIGINT_ZERO)) {
          return acc;
        }
        acc[balance.currency.wrapped.address] = balance;
        return acc;
      }, {});

      return balances;
    },
    placeholderData: keepPreviousData,
    refetchInterval: 5_000,
  });
}

// TODO: use InjectiveXService
import { Network, getNetworkEndpoints } from '@injectivelabs/networks';
import { ChainGrpcWasmApi, IndexerGrpcAccountPortfolioApi, fromBase64, toBase64 } from '@injectivelabs/sdk-ts';

export const NETWORK = Network.Mainnet;
export const ENDPOINTS = getNetworkEndpoints(NETWORK);
const indexerGrpcAccountPortfolioApi = new IndexerGrpcAccountPortfolioApi(ENDPOINTS.indexer);
const chainGrpcWasmApi = new ChainGrpcWasmApi(ENDPOINTS.grpc);

async function fetchBnUSDBalance(address) {
  try {
    const response: any = await chainGrpcWasmApi.fetchSmartContractState(
      injective.contracts.bnUSD!,
      toBase64({ balance: { address } }),
    );

    const result = fromBase64(response.data);
    return result;
  } catch (e) {
    console.log(e);
  }
  return { balance: '0' };
}

export function useInjectiveBalances(
  address: string | undefined,
  tokens: Token[],
): UseQueryResult<{
  [key: string]: CurrencyAmount<Currency>;
}> {
  return useQuery({
    queryKey: [`injectiveBalances`, address, tokens],
    queryFn: async () => {
      if (!address) return {};

      const portfolio = await indexerGrpcAccountPortfolioApi.fetchAccountPortfolioBalances(address);
      const bnUSDBalance = await fetchBnUSDBalance(address);

      const tokenMap = {};
      tokens.forEach(xToken => {
        tokenMap[xToken.symbol] = xToken;
      });

      const balances = portfolio.bankBalancesList.reduce((acc, balance) => {
        if (!balance) return acc;

        if (!(BigInt(balance.amount) > BIGINT_ZERO)) {
          return acc;
        }

        if (balance.denom === 'inj') {
          acc[tokenMap['INJ'].address] = CurrencyAmount.fromRawAmount(tokenMap['INJ'], BigInt(balance.amount));
        } else {
        }

        return acc;
      }, {});

      balances[tokenMap['bnUSD'].address] = CurrencyAmount.fromRawAmount(
        tokenMap['bnUSD'],
        BigInt(bnUSDBalance.balance),
      );

      return balances;
    },
    placeholderData: keepPreviousData,
    refetchInterval: 5_000,
  });
}
