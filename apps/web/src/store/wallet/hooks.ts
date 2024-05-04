import React, { useState, useEffect, useMemo } from 'react';

import { BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Token, CurrencyAmount, Currency } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';
import { Validator } from 'icon-sdk-js';
import JSBI from 'jsbi';
import { forEach } from 'lodash-es';
import { useIconReact } from 'packages/icon-react';
import { keepPreviousData, useQuery, UseQueryResult } from '@tanstack/react-query';
import { useDispatch, useSelector } from 'react-redux';

import { ARCHWAY_FEE_TOKEN_SYMBOL } from 'app/_xcall/_icon/config';
import { useArchwayContext } from 'app/_xcall/archway/ArchwayProvider';
import { useARCH } from 'app/_xcall/archway/tokens';
import { isDenomAsset } from 'app/_xcall/archway/utils';
import { SUPPORTED_XCALL_CHAINS } from 'app/_xcall/config';
import { XChain, XChainId } from 'app/_xcall/types';
import { getCrossChainTokenAddress } from 'app/_xcall/utils';
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
import { changeArchwayBalances, changeBalances, changeICONBalances } from './reducer';
import { useWallets, useXTokens } from 'app/pages/trade/bridge-v2/_hooks/hooks';

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
      if (!JSBI.greaterThan(balance.quotient, BIGINT_ZERO) && balance.currency.wrapped.address !== bnJs.BALN.address) {
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
  const { signingClient } = useArchwayContext();
  const arch = useARCH();

  return useQuery({
    queryKey: [`archwayBalances`, signingClient, address, tokens],
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
        if (!JSBI.greaterThan(balance.quotient, BIGINT_ZERO)) {
          return acc;
        }
        acc[balance.currency.wrapped.address] = balance;
        return acc;
      }, {});
    },
    placeholderData: keepPreviousData,
    enabled: !!signingClient && !!address,
    refetchInterval: 10000,
  });
}

import { coreConfig } from 'config/wagmi';
import { erc20Abi } from 'viem';
import { useAccount, useBalance } from 'wagmi';
import { multicall } from '@wagmi/core';

export function useEVMBalances(account: `0x${string}` | undefined, tokens: Token[] | undefined) {
  const { data } = useBalance({ address: account });
  const nativeBalance = useMemo(
    () =>
      data?.value
        ? CurrencyAmount.fromRawAmount(new Token(43114, NATIVE_ADDRESS, 18, 'AVAX', 'AVAX'), data?.value.toString())
        : undefined,
    [data],
  );

  const _tokens = useMemo(() => tokens?.filter(token => token.address !== NATIVE_ADDRESS), [tokens]);

  return useQuery({
    queryKey: [account, _tokens, nativeBalance],
    queryFn: async () => {
      if (!account || !_tokens || !nativeBalance) return;
      const result = await multicall(coreConfig, {
        contracts: _tokens.map(token => ({
          abi: erc20Abi,
          address: token.address as `0x${string}`,
          functionName: 'balanceOf',
          args: [account],
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
    balancesArch && dispatch(changeArchwayBalances(balancesArch));
  }, [balancesArch, dispatch]);

  // fetch balances on avax
  const { address } = useAccount();
  const avaxTokens = useXTokens('0xa86a.avax');
  const { data: avaxBalances } = useEVMBalances(address, avaxTokens);
  React.useEffect(() => {
    avaxBalances && dispatch(changeBalances({ xChainId: '0xa86a.avax', balances: avaxBalances }));
  }, [avaxBalances, dispatch]);
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
  const [balances, setBalances] = useState<(string | number | BigNumber)[]>([]);

  const transactions = useAllTransactions();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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

        const data: any[] = await bnJs.Multicall.getAggregateData(cds.filter(cd => cd.target.startsWith('cx')));
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

export const useCurrencyBalanceCrossChains = (currency: Currency): BigNumber => {
  const crossChainBalances = useCrossChainWalletBalances();

  return React.useMemo(() => {
    if (crossChainBalances) {
      return SUPPORTED_XCALL_CHAINS.reduce((balances, chain) => {
        if (crossChainBalances[chain]) {
          const tokenAddress = getCrossChainTokenAddress(chain, currency.wrapped.symbol);
          if (tokenAddress) {
            const balance = new BigNumber(crossChainBalances[chain]?.[tokenAddress]?.toFixed() || 0);
            balances = balances.plus(balance);
          }
        }
        return balances;
      }, new BigNumber(0));
    } else {
      return new BigNumber(0);
    }
  }, [crossChainBalances, currency]);
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

export function useSignedInWallets(): { chain: XChain; chainId: XChainId; address: string }[] {
  const wallets = useWallets();
  return useMemo(
    () =>
      Object.values(wallets)
        .filter(w => !!w.account)
        .map(w => ({ chainId: w.chain.xChainId, address: w.account!, chain: w.chain })),
    [wallets],
  );
}
