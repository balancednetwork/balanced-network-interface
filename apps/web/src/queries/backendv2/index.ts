import { CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import BigNumber from 'bignumber.js';

import bnJs from '@/bnJs';
import { NULL_CONTRACT_ADDRESS } from '@/constants/tokens';
import { API_ENDPOINT } from '@/queries/constants';
import { useIncentivisedPairs } from '@/queries/reward';
import { useEmissions } from '@/store/reward/hooks';
import { PairInfo } from '@/types';

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

const MIN_MARKETCAP_TO_INCLUDE = 5000;

export function useAllTokens() {
  return useQuery({
    queryKey: [`allTokens`],
    queryFn: async () => {
      const response = await axios.get<{ chain_id: number; total_supply: number; price: number; market_cap: number }[]>(
        `${API_ENDPOINT}/tokens`,
      );

      if (response.status === 200) {
        return response.data
          .map(item => {
            item['market_cap'] = item.total_supply * item.price;
            return item;
          })
          .filter(item => item['market_cap'] > MIN_MARKETCAP_TO_INCLUDE);
      }
    },
    placeholderData: keepPreviousData,
  });
}

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
