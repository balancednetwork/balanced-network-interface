import { CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import BigNumber from 'bignumber.js';

import { NULL_CONTRACT_ADDRESS } from '@/constants/tokens';
import { API_ENDPOINT } from '@/queries/constants';
import { useIncentivisedPairs } from '@/queries/reward';
import { useEmissions } from '@/store/reward/hooks';
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

export const useContractMethodsDataQuery = (
  contract: string,
  method: string,
  skip: number = 0,
  limit: number = 1000,
  days_ago?: number,
  start_timestamp?: number,
  end_timestamp?: number,
) => {
  return useQuery<ContractMethodsDataType[]>({
    queryKey: [`historicalQuery`, skip, limit, contract, method, days_ago, start_timestamp, end_timestamp],
    queryFn: async () => {
      const { data } = await axios.get(
        `${API_ENDPOINT}/contract-methods?skip=${skip}&limit=${limit}&address=${contract}&method=${method}${
          days_ago ? `&days_ago=${days_ago}` : ''
        }${start_timestamp ? `&start_timestamp=${start_timestamp}` : ''}${
          end_timestamp ? `&end_timestamp=${end_timestamp}` : ''
        }`,
      );

      return data.map(item => {
        item.timestamp *= 1_000;
        return item;
      });
    },
  });
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
        return response.data
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

export function useAllPairs() {
  const { data: allTokens, isSuccess: allTokensSuccess } = useAllTokensByAddress();
  const { data: incentivisedPairs, isSuccess: incentivisedPairsSuccess } = useIncentivisedPairs();
  const { data: dailyDistribution, isSuccess: dailyDistributionSuccess } = useEmissions();

  return useQuery<PairData[]>({
    queryKey: [`allPairs`, incentivisedPairs?.length, dailyDistribution?.toFixed()],
    queryFn: async () => {
      const response = await axios.get(`${API_ENDPOINT}/pools`);

      if (response.status === 200 && incentivisedPairs && dailyDistribution && allTokens) {
        const balnPrice: number = allTokens[bnJs.BALN.address].price;

        const pairs = response.data.map(item => {
          const liquidity = item['base_supply'] * item['base_price'] + item['quote_supply'] * item['quote_price'];
          const fees24hProviders =
            item['base_lp_fees_24h'] * item['base_price'] + item['quote_lp_fees_24h'] * item['quote_price'];
          const fees24hBaln =
            item['base_baln_fees_24h'] * item['base_price'] + item['quote_baln_fees_24h'] * item['quote_price'];
          const fees30dProviders =
            item['base_lp_fees_30d'] * item['base_price'] + item['quote_lp_fees_30d'] * item['quote_price'];
          const fees30dBaln =
            item['base_baln_fees_30d'] * item['base_price'] + item['quote_baln_fees_30d'] * item['quote_price'];
          const volume24h =
            item['base_volume_24h'] * item['base_price'] + item['quote_volume_24h'] * item['quote_price'];
          const volume30d =
            item['base_volume_30d'] * item['base_price'] + item['quote_volume_30d'] * item['quote_price'];

          const fees24h = fees24hProviders + fees24hBaln;
          const fees30d = fees30dProviders + fees30dBaln;
          const feesApy = liquidity > 0 ? (fees30dProviders * 12) / liquidity : 0;

          const incentivisedPair = incentivisedPairs.find(incentivisedPair => incentivisedPair.id === item.pool_id);

          const baseToken = new Token(
            item['chain_id'],
            item['base_address'] === 'ICX' ? NULL_CONTRACT_ADDRESS : item['base_address'],
            item['base_decimals'],
            item['base_symbol'],
          );

          const quoteToken = new Token(
            item['chain_id'],
            item['quote_address'] === 'ICX' ? NULL_CONTRACT_ADDRESS : item['quote_address'],
            item['quote_decimals'],
            item['quote_symbol'],
          );

          const pair: PairData = {
            info: {
              chainId: item['chain_id'],
              id: item['pool_id'],
              name: item['name'],
              baseCurrencyKey: item['base_symbol'],
              quoteCurrencyKey: item['quote_symbol'],
              baseToken: baseToken,
              quoteToken: quoteToken,
            },
            name: item['name'],
            liquidity,
            fees24h: fees24h || 0,
            fees30d: fees30d || 0,
            volume24h,
            volume30d,
            feesApy: feesApy || 0,
            balnApy: 0,
            totalSupply: new BigNumber(item['total_supply']),
            totalBase: CurrencyAmount.fromRawAmount(
              baseToken,
              parseInt(new BigNumber(item['base_supply'] * 10 ** item['base_decimals']).toFixed(0)),
            ),
            totalQuote: CurrencyAmount.fromRawAmount(
              quoteToken,
              parseInt(new BigNumber(item['quote_supply'] * 10 ** item['quote_decimals']).toFixed(0)),
            ),
            stakedRatio: new Fraction(1),
          };

          if (incentivisedPair) {
            const stakedRatio =
              incentivisedPair.id !== 1
                ? new Fraction(incentivisedPair.totalStaked, item['total_supply'])
                : new Fraction(1);
            pair['balnApy'] = dailyDistribution
              .times(new BigNumber(incentivisedPair.rewards.toFixed(4)))
              .times(365)
              .times(balnPrice)
              .div(new BigNumber(stakedRatio.toFixed(18)).times(liquidity))
              .toNumber();
            pair['stakedRatio'] = stakedRatio;
          }

          return pair;
        });

        return pairs.filter(item => item.liquidity >= MIN_LIQUIDITY_TO_INCLUDE || item.name === 'sICX/ICX');
      }
    },
    placeholderData: keepPreviousData,
    enabled: incentivisedPairsSuccess && dailyDistributionSuccess && allTokensSuccess,
  });
}

export function useAllPairsById() {
  const { data: allPairs, isSuccess: allPairsSuccess } = useAllPairs();

  return useQuery<{ [key in string]: PairData } | undefined>({
    queryKey: ['allPairsById'],
    queryFn: () => {
      if (!allPairs) return;

      return allPairs.reduce((allPairs, item) => {
        allPairs[item.info['id']] = item;
        return allPairs;
      }, {});
    },
    placeholderData: keepPreviousData,
    enabled: allPairsSuccess && !!allPairs,
  });
}

export function useAllPairsByName() {
  const { data: allPairs, isSuccess: allPairsSuccess } = useAllPairs();

  return useQuery<{ [key in string]: PairData } | undefined>({
    queryKey: ['allPairsByName'],
    queryFn: () => {
      if (!allPairs) return;

      return allPairs.reduce((allPairs, item) => {
        allPairs[item['name']] = item;
        return allPairs;
      }, {});
    },
    placeholderData: keepPreviousData,
    enabled: allPairsSuccess && !!allPairs,
  });
}

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
