import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';

import { canBeQueue } from '@/constants/currency';
import { bnUSD } from '@/constants/tokens';
import { fetchStabilityFundBalances, getAcceptedTokens } from '@/store/stabilityFund/hooks';
import { getPair } from '@/utils';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

import { NETWORK_ID } from '@/constants/config';

const MULTI_CALL_BATCH_SIZE = 25;

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export type PairData = [PairState, Pair | null, BigNumber | null] | [PairState, Pair | null];

export const fetchStabilityFundPairs = async () => {
  const acceptedTokens = await getAcceptedTokens();
  const stabilityFundBalances = await fetchStabilityFundBalances(
    acceptedTokens.filter(
      x => x === 'cx22319ac7f412f53eabe3c9827acf5e27e9c6a95f' || x === 'cx16f3cb9f09f5cdd902cf07aa752c8b3bd1bc9609',
    ), // only USDC and USDT
  );
  const stabilityFundPairs = Object.values(stabilityFundBalances).map(balance => {
    return new Pair(balance, CurrencyAmount.fromRawAmount(bnUSD[NETWORK_ID], '1'), { isStabilityFund: true });
  });
  return stabilityFundPairs;
};

export const useStabilityFundPairs = () => {
  const { data: stabilityFundPairs } = useQuery({
    queryKey: ['stabilityFundPairs'],
    queryFn: fetchStabilityFundPairs,
    refetchInterval: 10_000,
  });

  return stabilityFundPairs || [];
};

const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  return array.reduce((resultArray: T[][], item, index) => {
    const chunkIndex = Math.floor(index / chunkSize);
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);
};

export async function fetchV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): Promise<PairData[]> {
  const tokens = currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]);

  try {
    const callData: CallData[] = tokens.map(([tokenA, tokenB]) => {
      if (tokenA && tokenB && tokenA.chainId === tokenB.chainId && !tokenA.equals(tokenB)) {
        if (canBeQueue(tokenA, tokenB)) {
          return {
            target: bnJs.Dex.address,
            method: 'getPoolStats',
            params: [`0x${BalancedJs.utils.POOL_IDS.sICXICX.toString(16)}`],
          };
        } else {
          return {
            target: bnJs.Dex.address,
            method: 'getPoolStatsForPair',
            params: [tokenA.address, tokenB.address],
          };
        }
      } else {
        // Useless, just a placeholder
        return {
          target: bnJs.Multicall.address,
          method: 'getBlockNumber',
          params: [],
        };
      }
    });

    const chunks = chunkArray(callData, MULTI_CALL_BATCH_SIZE);
    const chunkedData = await Promise.all(chunks.map(async chunk => await bnJs.Multicall.getAggregateData(chunk)));
    const data: any[] = chunkedData.flat();

    const pairs = data.map((stats, idx): PairData => {
      const [tokenA, tokenB] = tokens[idx];
      if (!tokenA || !tokenB || !stats) {
        return [PairState.NOT_EXISTS, null, null];
      }
      return getPair(stats, tokenA, tokenB);
    });

    return pairs;
  } catch (err) {
    return Array(tokens.length).fill([PairState.INVALID, null]);
  }
}

export function useV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): PairData[] {
  const tokens = useMemo(() => {
    return currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]);
  }, [currencies]);

  const { data: pairs } = useQuery({
    queryKey: ['v2Pairs', tokens],
    queryFn: () => fetchV2Pairs(currencies),
    enabled: tokens.length > 0,
    refetchInterval: 10_000,
  });

  return pairs || Array(tokens.length).fill([PairState.LOADING, null]);
}

export function useV2Pair(tokenA?: Currency, tokenB?: Currency): PairData {
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB]);
  return useV2Pairs(inputs)[0];
}

export interface BalanceData {
  poolId: number;

  // liquidity balance or ICX balance
  balance: CurrencyAmount<Token>;

  // sICX balance
  balance1?: CurrencyAmount<Token>;

  suppliedLP?: CurrencyAmount<Token>;

  stakedLPBalance?: CurrencyAmount<Token>;
}
