import React, { useEffect, useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';
import { forEach } from 'lodash-es';
import { useDispatch, useSelector } from 'react-redux';

import { MINIMUM_ICX_FOR_TX } from '@/constants/index';
import { COMBINED_TOKENS_LIST, SUPPORTED_TOKENS_LIST } from '@/constants/tokens';
import { useBnJsContractQuery } from '@/queries/utils';
import { useTokenListConfig } from '@/store/lists/hooks';
import { useAllTransactions } from '@/store/transactions/hooks';
import { useUserAddedTokens } from '@/store/user/hooks';
import { getXTokenAddress, isXToken } from '@/utils/xTokens';
import { XToken, XWalletAssetRecord } from '@balancednetwork/xwagmi';
import { bnJs } from '@balancednetwork/xwagmi';

import { AppState } from '..';
import { useAllTokens } from '../../hooks/Tokens';
import { changeBalances } from './reducer';

import { useXBalances } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';

import { useSignedInWallets } from '@/hooks/useWallets';
import useXTokens from '@/hooks/useXTokens';
import { useRatesWithOracle } from '@/queries/reward';
import { SUPPORTED_XCALL_CHAINS, stellar } from '@balancednetwork/xwagmi';
import { useXAccount } from '@balancednetwork/xwagmi';

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
  return useSelector((state: AppState) => state.wallet['0x1.icon'] || {});
}

export function useWalletBalances(xChainId: XChainId): { [address: string]: CurrencyAmount<Currency> } | undefined {
  return useSelector((state: AppState) => state.wallet[xChainId]);
}

export function useWalletFetchBalances() {
  const dispatch = useDispatch();

  // fetch balances on icon
  const tokenListConfig = useTokenListConfig();
  const userAddedTokens = useUserAddedTokens();
  const iconTokens = useMemo(() => {
    return tokenListConfig.community
      ? [...COMBINED_TOKENS_LIST, ...userAddedTokens]
      : [...SUPPORTED_TOKENS_LIST, ...userAddedTokens];
  }, [userAddedTokens, tokenListConfig]);
  const iconXTokens = useMemo(
    () => iconTokens.map(token => new XToken('0x1.icon', token.chainId, token.address, token.decimals, token.symbol)),
    [iconTokens],
  );
  const { account: accountIcon } = useIconReact();
  const { data: balancesIcon } = useXBalances({
    xChainId: '0x1.icon',
    xTokens: iconXTokens,
    address: accountIcon,
  });
  useEffect(() => {
    balancesIcon && dispatch(changeBalances({ xChainId: '0x1.icon', balances: balancesIcon }));
  }, [balancesIcon, dispatch]);

  // fetch balances on havah
  const { address: accountHavah } = useXAccount('HAVAH');
  const havahTokens = useXTokens('0x100.icon') || [];
  const { data: balancesHavah } = useXBalances({
    xChainId: '0x100.icon',
    xTokens: havahTokens,
    address: accountHavah,
  });
  useEffect(() => {
    balancesHavah && dispatch(changeBalances({ xChainId: '0x100.icon', balances: balancesHavah }));
  }, [balancesHavah, dispatch]);

  // fetch balances on archway
  const { address: accountArch } = useXAccount('ARCHWAY');
  const tokensArch = useXTokens('archway-1') || [];
  const { data: balancesArch } = useXBalances({
    xChainId: 'archway-1',
    xTokens: tokensArch,
    address: accountArch,
  });

  useEffect(() => {
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
  useEffect(() => {
    avaxBalances && dispatch(changeBalances({ xChainId: '0xa86a.avax', balances: avaxBalances }));
  }, [avaxBalances, dispatch]);

  // fetch balances on bsc
  const bscTokens = useXTokens('0x38.bsc');
  const { data: bscBalances } = useXBalances({
    xChainId: '0x38.bsc',
    xTokens: bscTokens,
    address,
  });
  useEffect(() => {
    bscBalances && dispatch(changeBalances({ xChainId: '0x38.bsc', balances: bscBalances }));
  }, [bscBalances, dispatch]);

  // fetch balances on arb
  const arbTokens = useXTokens('0xa4b1.arbitrum');
  const { data: arbBalances } = useXBalances({
    xChainId: '0xa4b1.arbitrum',
    xTokens: arbTokens,
    address,
  });
  useEffect(() => {
    arbBalances && dispatch(changeBalances({ xChainId: '0xa4b1.arbitrum', balances: arbBalances }));
  }, [arbBalances, dispatch]);

  // fetch balances on op
  const optTokens = useXTokens('0xa.optimism');
  const { data: optBalances } = useXBalances({
    xChainId: '0xa.optimism',
    xTokens: optTokens,
    address,
  });
  useEffect(() => {
    optBalances && dispatch(changeBalances({ xChainId: '0xa.optimism', balances: optBalances }));
  }, [optBalances, dispatch]);

  // fetch balances on base
  const baseTokens = useXTokens('0x2105.base');
  const { data: baseBalances } = useXBalances({
    xChainId: '0x2105.base',
    xTokens: baseTokens,
    address,
  });
  useEffect(() => {
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
  useEffect(() => {
    injectiveBalances && dispatch(changeBalances({ xChainId: 'injective-1', balances: injectiveBalances }));
  }, [injectiveBalances, dispatch]);

  // fetch balances on stellar
  const { address: accountStellar } = useXAccount('STELLAR');
  const stellarTokens = useXTokens(stellar.xChainId);
  const { data: stellarBalances } = useXBalances({
    xChainId: stellar.xChainId,
    xTokens: stellarTokens,
    address: accountStellar,
  });
  useEffect(() => {
    stellarBalances && dispatch(changeBalances({ xChainId: stellar.xChainId, balances: stellarBalances }));
  }, [stellarBalances, dispatch]);

  //fetch balances on sui
  const { address: accountSui } = useXAccount('SUI');
  const suiTokens = useXTokens('sui');
  const { data: suiBalances } = useXBalances({
    xChainId: 'sui',
    xTokens: suiTokens,
    address: accountSui,
  });
  useEffect(() => {
    suiBalances && dispatch(changeBalances({ xChainId: 'sui', balances: suiBalances }));
  }, [suiBalances, dispatch]);

  // fetch balances on solana
  const { address: accountSolana } = useXAccount('SOLANA');
  const solanaTokens = useXTokens('solana');
  const { data: solanaBalances } = useXBalances({
    xChainId: 'solana',
    xTokens: solanaTokens,
    address: accountSolana,
  });
  useEffect(() => {
    solanaBalances && dispatch(changeBalances({ xChainId: 'solana', balances: solanaBalances }));
  }, [solanaBalances, dispatch]);
}

export const useBALNDetails = (): { [key in string]?: BigNumber } => {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const [details, setDetails] = React.useState({});

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const fetchDetails = async () => {
      if (account) {
        const result = await bnJs.BALN.balanceOf(account);
        setDetails({
          'Staked balance': new BigNumber(0),
          'Available balance': BalancedJs.utils.toIcx(result),
        });
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

export function useAllTokenBalances(account: string | undefined | null): {
  [tokenAddress: string]: CurrencyAmount<XToken> | undefined;
} {
  const allTokens = useAllTokens();
  const allTokensArray = useMemo(() => Object.values(allTokens ?? {}), [allTokens]);
  const iconXTokens = useMemo(
    () =>
      allTokensArray.map(token => new XToken('0x1.icon', token.chainId, token.address, token.decimals, token.symbol)),
    [allTokensArray],
  );

  const { data: balances } = useXBalances({
    xChainId: '0x1.icon',
    xTokens: iconXTokens,
    address: account ?? undefined,
  });
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

export function useXTokenBalances(xTokens: (XToken | undefined)[]): (CurrencyAmount<XToken> | undefined)[] {
  const walletState = useSelector((state: AppState) => state.wallet);

  return useMemo(() => {
    return xTokens.map(xToken => {
      if (!xToken) return undefined;
      return walletState[xToken.xChainId]?.[xToken.address];
    });
  }, [xTokens, walletState]);
}

// TODO: deprecate
export function useCurrencyBalances(currencies: (Currency | undefined)[]): (CurrencyAmount<XToken> | undefined)[] {
  const walletState = useSelector((state: AppState) => state.wallet);

  return useMemo(() => {
    return currencies.map(currency => {
      if (!currency) return undefined;
      return walletState['0x1.icon']?.[currency.address];
    });
  }, [walletState, currencies]);
}

export function useLiquidityTokenBalance(account: string | undefined | null, pair: Pair | undefined | null) {
  const query = useBnJsContractQuery<string>('Dex', 'xBalanceOf', [account, pair?.poolId]);
  const { data } = query;
  return pair && data ? CurrencyAmount.fromRawAmount<Token>(pair.liquidityToken, data) : undefined;
}

export function useXBalancesByToken(): XWalletAssetRecord[] {
  const balances = useCrossChainWalletBalances();
  const tokenListConfig = useTokenListConfig();
  const prices = useRatesWithOracle();
  const MIN_VALUE_TO_DISPLAY = new BigNumber(0.01);

  return React.useMemo(() => {
    return Object.entries(
      Object.entries(balances).reduce(
        (acc, [chainId, chainBalances]) => {
          if (chainBalances) {
            forEach(chainBalances, balance => {
              const price = prices?.[balance.currency?.symbol || ''] || new BigNumber(0);
              if (
                balance.currency &&
                balance?.greaterThan(0) &&
                (price.isZero() || price.times(balance.toFixed()).isGreaterThan(MIN_VALUE_TO_DISPLAY))
              ) {
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
  }, [balances, tokenListConfig, prices, MIN_VALUE_TO_DISPLAY]);
}
