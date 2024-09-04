import { useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { BalancedJs, CallData, addresses } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import { NETWORK_ID } from '@/constants/config';
import {
  COMBINED_TOKENS_MAP_BY_ADDRESS,
  ORACLE_PRICED_TOKENS,
  SUPPORTED_TOKENS_MAP_BY_ADDRESS,
} from '@/constants/tokens';
import { useTokenPrices } from '@/queries/backendv2';
import QUERY_KEYS from '@/queries/queryKeys';
import { useBlockNumber } from '@/store/application/hooks';
import { useOraclePrices } from '@/store/oracle/hooks';
import { useFlattenedRewardsDistribution } from '@/store/reward/hooks';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

export const BATCH_SIZE = 10;

export const usePlatformDayQuery = () => {
  return useQuery<number>({
    queryKey: QUERY_KEYS.Reward.PlatformDay,
    queryFn: async () => {
      const res = await bnJs.Governance.getDay();
      return parseInt(res, 16);
    },
  });
};

// combine rates api data & oracle data
export const useRatesWithOracle = () => {
  const { data: rates } = useTokenPrices();
  const oraclePrices = useOraclePrices();

  return useMemo(() => {
    if (!rates || !oraclePrices) return;

    const combinedRates = { ...rates };

    Object.keys(oraclePrices).forEach(token => {
      if (!combinedRates[token] || ORACLE_PRICED_TOKENS.includes(token)) {
        combinedRates[token] = oraclePrices[token];
      }
    });

    // add WBTC price
    combinedRates['WBTC'] = combinedRates['BTC'];

    return combinedRates;
  }, [rates, oraclePrices]);
};

export const useIncentivisedPairs = (): UseQueryResult<
  { name: string; id: number; rewards: Fraction; totalStaked: number }[],
  Error
> => {
  const { data: rewards } = useFlattenedRewardsDistribution();

  return useQuery({
    queryKey: ['incentivisedPairs', rewards],
    queryFn: async () => {
      if (!rewards) return;

      const lpData = await bnJs.StakedLP.getDataSources();
      const lpSources: string[] = ['sICX/ICX', ...lpData];

      const cds: CallData[] = lpSources.map(source => ({
        target: addresses[NETWORK_ID].stakedLp,
        method: 'getSourceId',
        params: [source],
      }));

      const sourceIDs = await bnJs.Multicall.getAggregateData(cds);

      const sourcesTotalStaked = await Promise.all(
        sourceIDs.map(async (source, index) => await bnJs.StakedLP.totalStaked(index === 0 ? 1 : parseInt(source, 16))),
      );

      return lpSources.map((source, index) => ({
        name: source,
        id: index === 0 ? 1 : parseInt(sourceIDs[index], 16),
        rewards: rewards[source],
        totalStaked: parseInt((sourcesTotalStaked[index] as string) ?? '0x0', 16),
      }));
    },
    enabled: !!rewards,
    placeholderData: keepPreviousData,
  });
};
