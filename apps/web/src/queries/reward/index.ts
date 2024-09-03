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

export const useUserCollectedFeesQuery = (start: number = 0, end: number = 0) => {
  const { account } = useIconReact();

  return useQuery<({ [address in string]: CurrencyAmount<Currency> } | null)[] | undefined>({
    queryKey: QUERY_KEYS.Reward.UserCollectedFees(account ?? '', start, end),
    queryFn: async () => {
      if (!account) return;

      const promises: Promise<any>[] = [];
      for (let i = end; i > 1; i -= BATCH_SIZE) {
        const startValue = i - BATCH_SIZE;
        promises.push(bnJs.Dividends.getUserDividends(account, startValue > 0 ? startValue : 0, i));
      }

      let feesArr = await Promise.all(promises);

      feesArr = feesArr.map(fees => {
        if (!fees) return null;
        if (!Object.values(fees).find(value => !BalancedJs.utils.toIcx(value as string).isZero())) return null;

        const t = Object.keys(fees).reduce((prev, address) => {
          const currency = COMBINED_TOKENS_MAP_BY_ADDRESS[address];
          prev[address] = CurrencyAmount.fromFractionalAmount(currency, fees[address], 1);
          return prev;
        }, {});

        return t;
      });

      return feesArr;
    },
    enabled: !!account,
  });
};

export const usePlatformDayQuery = () => {
  return useQuery<number>({
    queryKey: QUERY_KEYS.Reward.PlatformDay,
    queryFn: async () => {
      const res = await bnJs.Governance.getDay();
      return parseInt(res, 16);
    },
  });
};

export const useLPReward = () => {
  const { account } = useIconReact();
  const blockNumber = useBlockNumber();

  return useQuery<CurrencyAmount<Token> | undefined>({
    queryKey: [QUERY_KEYS.Reward.UserReward(account ?? ''), blockNumber],
    queryFn: async () => {
      if (!account) return;

      const res = await bnJs.Rewards.getBalnHolding(account);
      return CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.BALN.address], res);
    },
    placeholderData: keepPreviousData,
    enabled: !!account,
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

export const useICXConversionFee = () => {
  return useQuery({
    queryKey: ['icxConversionFee'],
    queryFn: async () => {
      const feesRaw = await bnJs.Dex.getFees();
      const fee = new Fraction(feesRaw['icx_conversion_fee'], 100);
      return fee;
    },
  });
};
