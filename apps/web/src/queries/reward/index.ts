import { useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { BalancedJs, CallData, addresses } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Token, XChainId } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';

import { NETWORK_ID } from '@/constants/config';
import { COMBINED_TOKENS_MAP_BY_ADDRESS, ORACLE_PRICED_TOKENS } from '@/constants/tokens';
import { useTokenPrices } from '@/queries/backendv2';
import QUERY_KEYS from '@/queries/queryKeys';
import { useBlockNumber } from '@/store/application/hooks';
import { useOraclePrices } from '@/store/oracle/hooks';
import { useFlattenedRewardsDistribution } from '@/store/reward/hooks';
import { ICON_XCALL_NETWORK_ID, XToken, bnJs, xTokenMapBySymbol } from '@balancednetwork/xwagmi';

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

export const useLPReward = account => {
  const blockNumber = useBlockNumber();

  return useQuery<CurrencyAmount<Token> | undefined>({
    queryKey: [QUERY_KEYS.Reward.UserReward(account ?? ''), blockNumber],
    queryFn: async () => {
      if (!account) return;

      const res = await bnJs.Rewards.getRewards(account);
      const BALN = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID]['BALN'];
      return CurrencyAmount.fromRawAmount(BALN, res[BALN.address]);
    },
    placeholderData: keepPreviousData,
    enabled: !!account,
  });
};

export type LPRewards = {
  [chainId in XChainId]?: CurrencyAmount<XToken>;
};

export const useLPRewards = (accounts): UseQueryResult<LPRewards | undefined> => {
  return useQuery<LPRewards | undefined>({
    queryKey: ['rewards', accounts],
    queryFn: async () => {
      if (!accounts || accounts.length === 0) return {};

      const cds = accounts.map(account => {
        return {
          target: bnJs.Rewards.address,
          method: 'getRewards',
          params: [account],
        };
      });

      const rawRewards = await bnJs.Multicall.getAggregateData(cds);

      return rawRewards.reduce((acc, reward, index) => {
        const xChainId = accounts[index].split('/')[0];
        const BALN = xTokenMapBySymbol[ICON_XCALL_NETWORK_ID]['BALN'];
        acc[xChainId] = CurrencyAmount.fromRawAmount(BALN, reward[BALN.address]);
        return acc;
      }, {});
    },
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
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
