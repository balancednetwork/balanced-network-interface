import { CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import BigNumber from 'bignumber.js';

import { API_ENDPOINT } from '@/queries/constants';
import { PairInfo } from '@/types';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

export type ContractMethodsDataType = {
  address: string;
  timestamp: number;
  updateInterval: number;
  method: string;
  days_since_launch: number;
  date: string;
  contract_name: string;
  value: number;
};

const MIN_TOKEN_LIQUIDITY_TO_INCLUDE = 500;
export const TOKEN_BLACKLIST = ['IUSDC', 'USDS', 'BUSD', 'BTCB', 'FIN', 'METX'];
export const TOKEN_WHITELIST = ['USDC'];

export function useAllTokens() {
  return useQuery({
    queryKey: [`allTokens`],
    queryFn: async () => {
      const response = await axios.get<TokenStats[]>(`${API_ENDPOINT}/tokens`);

      if (response.status === 200) {
        const tokens = response.data
          .map(item => {
            item.market_cap = item.total_supply * item.price;
            item.price_24h_change = ((item.price - item.price_24h) / item.price_24h) * 100;
            return item;
          })
          .filter(item => {
            return (
              TOKEN_WHITELIST.includes(item.symbol) ||
              (!TOKEN_BLACKLIST.includes(item.symbol) && item.liquidity > MIN_TOKEN_LIQUIDITY_TO_INCLUDE)
            );
          });

        const tokensWithStabilityFundLiquidity = await Promise.all(
          tokens.map(async token => {
            if (token['in_stability_fund']) {
              const cx = bnJs.getContract(token.address);
              const decimals = await cx.decimals();
              const amount = await cx.balanceOf(bnJs.StabilityFund.address);
              const balance = new BigNumber(amount).div(10 ** parseInt(decimals, 16)).toNumber();

              if (balance > 0) {
                token.liquidity = balance;
              }
            }
            return token;
          }),
        );

        return tokensWithStabilityFundLiquidity;
      }
    },
    placeholderData: keepPreviousData,
  });
}

export function useAllTokensByAddress() {
  const { data: allTokens, isSuccess: allTokensSuccess } = useAllTokens();

  return useQuery({
    queryKey: [`allTokensByAddress`],
    queryFn: () => {
      return allTokens?.reduce(
        (tokens, item) => {
          tokens[item.address] = item;
          return tokens;
        },
        {} as { [TokenAddress in string]: TokenStats },
      );
    },
    placeholderData: keepPreviousData,
    enabled: allTokensSuccess,
  });
}

export type TokenStats = {
  symbol: string;
  name: string;
  address: string;
  chain_id: number;
  total_supply: number;
  price: number;
  price_24h: number;
  price_24h_change: number;
  liquidity: number;
  market_cap: number;
  type: 'balanced' | 'community';
};

export type PairData = {
  info: PairInfo;
  name: string;
  liquidity: number;
  fees24h: number;
  fees30d: number;
  volume24h: number;
  volume30d: number;
  feesApy: number;
  balnApy: number;
  totalBase: CurrencyAmount<Token>;
  totalQuote: CurrencyAmount<Token>;
  totalSupply: BigNumber;
  stakedRatio: Fraction;
};

export const MIN_LIQUIDITY_TO_INCLUDE = 1000;

export function useTokenPrices() {
  const { data: allTokens, isSuccess: allTokensSuccess } = useAllTokens();

  return useQuery<{ [key in string]: BigNumber }>({
    queryKey: [`tokenPrices`, allTokens],
    queryFn: () => {
      return (
        allTokens?.reduce((tokens, item) => {
          tokens[item['symbol']] = new BigNumber(item.price);
          return tokens;
        }, {}) || {}
      );
    },
    placeholderData: keepPreviousData,
    enabled: allTokensSuccess,
  });
}

export function useTokenTrendData(tokenSymbol, start, end) {
  return useQuery({
    queryKey: [`trend`, tokenSymbol, start, end],
    queryFn: async () => {
      const { data } = await axios.get(`${API_ENDPOINT}/tokens/series/1h/${start}/${end}?symbol=${tokenSymbol}`);
      return data;
    },
    placeholderData: keepPreviousData,
  });
}
