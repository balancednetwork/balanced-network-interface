import { useMemo } from 'react';

import { addresses, BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useQuery, UseQueryResult } from 'react-query';

import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { COMBINED_TOKENS_MAP_BY_ADDRESS, SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useAllTokens } from 'queries/backendv2';
import QUERY_KEYS from 'queries/queryKeys';
import { useBlockNumber } from 'store/application/hooks';
import { useOraclePrices } from 'store/oracle/hooks';
import { useFlattenedRewardsDistribution } from 'store/reward/hooks';

export const BATCH_SIZE = 10;

export const useUserCollectedFeesQuery = (start: number = 0, end: number = 0) => {
  const { account } = useIconReact();

  return useQuery<({ [address in string]: CurrencyAmount<Currency> } | null)[]>(
    QUERY_KEYS.Reward.UserCollectedFees(account ?? '', start, end),
    async () => {
      const promises: Promise<any>[] = [];
      for (let i = end; i > 1; i -= BATCH_SIZE) {
        const startValue = i - BATCH_SIZE;
        promises.push(bnJs.Dividends.getUserDividends(account!, startValue > 0 ? startValue : 0, i));
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
    {
      enabled: !!account,
    },
  );
};

export const usePlatformDayQuery = () => {
  return useQuery<number>(QUERY_KEYS.Reward.PlatformDay, async () => {
    const res = await bnJs.Governance.getDay();
    return parseInt(res, 16);
  });
};

export const useLPReward = (): UseQueryResult<CurrencyAmount<Token>> => {
  const { account } = useIconReact();
  const blockNumber = useBlockNumber();

  return useQuery<CurrencyAmount<Token>>(
    `${QUERY_KEYS.Reward.UserReward(account ?? '')}-${blockNumber}`,
    async () => {
      const res = await bnJs.Rewards.getBalnHolding(account!);
      return CurrencyAmount.fromRawAmount(SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.BALN.address], res);
    },
    { keepPreviousData: true, enabled: !!account },
  );
};

export const useRatesQuery = () => {
  const { data: allTokens, isSuccess: allTokensSuccess } = useAllTokens();

  return useQuery<{ [key in string]: BigNumber }>(
    `tokenPrices${allTokens}`,
    () => {
      return allTokens.reduce((tokens, item) => {
        tokens[item['symbol']] = new BigNumber(item.price);
        return tokens;
      }, {});
    },
    {
      keepPreviousData: true,
      enabled: allTokensSuccess,
    },
  );
};

export const useRatesWithOracle = () => {
  const { data: rates } = useRatesQuery();
  const oraclePrices = useOraclePrices();

  return useMemo(() => {
    const updatedRates = { ...rates };
    oraclePrices &&
      Object.keys(oraclePrices).forEach(token => {
        if (!updatedRates[token]) updatedRates[token] = oraclePrices[token];
      });
    if (oraclePrices) return updatedRates;
  }, [rates, oraclePrices]);
};

export const useIncentivisedPairs = (): UseQueryResult<
  { name: string; id: number; rewards: Fraction; totalStaked: number }[],
  Error
> => {
  const { data: rewards } = useFlattenedRewardsDistribution();

  return useQuery(
    ['incentivisedPairs', rewards],
    async () => {
      if (rewards) {
        const lpData = await bnJs.StakedLP.getDataSources();
        const lpSources: string[] = ['sICX/ICX', ...lpData];

        const cds: CallData[] = lpSources.map(source => ({
          target: addresses[NETWORK_ID].stakedLp,
          method: 'getSourceId',
          params: [source],
        }));

        const sourceIDs = await bnJs.Multicall.getAggregateData(cds);

        const sourcesTotalStaked = await Promise.all(
          sourceIDs.map(
            async (source, index) => await bnJs.StakedLP.totalStaked(index === 0 ? 1 : parseInt(source, 16)),
          ),
        );

        return lpSources.map((source, index) => ({
          name: source,
          id: index === 0 ? 1 : parseInt(sourceIDs[index], 16),
          rewards: rewards[source],
          totalStaked: parseInt((sourcesTotalStaked[index] as string) ?? '0x0', 16),
        }));
      }
    },
    {
      keepPreviousData: true,
    },
  );
};

export const useICXConversionFee = () => {
  return useQuery('icxConversionFee', async () => {
    try {
      const feesRaw = await bnJs.Dex.getFees();
      const fee = new Fraction(feesRaw['icx_conversion_fee'], 100);
      return fee;
    } catch (e) {
      console.error(e);
    }
  });
};
