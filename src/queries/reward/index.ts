import { useMemo } from 'react';

import { addresses, BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useQuery, UseQueryResult } from 'react-query';

import bnJs from 'bnJs';
import { NETWORK_ID } from 'constants/config';
import { COMBINED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import QUERY_KEYS from 'queries/queryKeys';
import { useBlockNumber } from 'store/application/hooks';
import { useOraclePrices } from 'store/oracle/hooks';
import { useEmissions, useFlattenedRewardsDistribution } from 'store/reward/hooks';
import { PoolInfo } from 'types';
import { getPoolFromName } from 'utils';

import { API_ENDPOINT } from '../constants';

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

export const useRewardQuery = () => {
  const { account } = useIconReact();
  const blockNumber = useBlockNumber();

  return useQuery<BigNumber>(
    `${QUERY_KEYS.Reward.UserReward(account ?? '')}-${blockNumber}`,
    async () => {
      const res = await bnJs.Rewards.getBalnHolding(account!);
      return BalancedJs.utils.toIcx(res);
    },
    { keepPreviousData: true },
  );
};

export const useRatesQuery = () => {
  const fetch = async () => {
    const { data } = await axios.get(`${API_ENDPOINT}/stats/token-stats`);

    const rates: { [key in string]: BigNumber } = {};
    const _tokens = data.tokens;
    Object.keys(_tokens).forEach(tokenKey => {
      rates[tokenKey] = BalancedJs.utils.toIcx(_tokens[tokenKey].price);
    });

    return rates;
  };

  return useQuery<{ [key in string]: BigNumber }>('useRatesQuery', fetch);
};

export const useRatesWithOracle = () => {
  const { data: rates } = useRatesQuery();
  const oraclePrices = useOraclePrices();

  return useMemo(() => {
    const updatedRates = { ...rates };
    oraclePrices && Object.keys(oraclePrices).forEach(token => (updatedRates[token] = oraclePrices[token]));
    if (oraclePrices) return updatedRates;
  }, [rates, oraclePrices]);
};

export const useIncentivisedPairs = (): UseQueryResult<{ name: string; id: number; rewards: Fraction }[], Error> => {
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

        return lpSources.map((source, index) => ({
          name: source,
          id: index === 0 ? 1 : parseInt(sourceIDs[index], 16),
          rewards: rewards[source],
        }));
      }
    },
    {
      keepPreviousData: true,
    },
  );
};

export const useAllPairsAPY = (): { [key: number]: BigNumber } | undefined => {
  const tvls = useAllPairsTVL();
  const { data: rates } = useRatesQuery();
  const { data: incentivisedPairs } = useIncentivisedPairs();
  const { data: emissions } = useEmissions();

  if (tvls && rates && incentivisedPairs && emissions) {
    return incentivisedPairs.reduce((apys, pair) => {
      apys[pair.name] = emissions
        .times(new BigNumber(pair.rewards.toFixed(4)))
        .times(365)
        .times(rates['BALN'])
        .div(tvls[pair.id]);
      return apys;
    }, {});
  }

  return;
};

export const useAllPairsTVLQuery = () => {
  const { data: incentivisedPairs } = useIncentivisedPairs();
  return useQuery<{ [key: string]: { base: BigNumber; quote: BigNumber; total_supply: BigNumber } } | undefined>(
    ['useAllPairsTVLQuery', incentivisedPairs],
    async () => {
      if (incentivisedPairs) {
        const res: Array<any> = await Promise.all(
          incentivisedPairs.map(async pair => {
            const { data } = await axios.get(`${API_ENDPOINT}/dex/stats/${pair.id}`);
            return data;
          }),
        );

        const t = {};
        incentivisedPairs.forEach((pair, index) => {
          const pool = getPoolFromName(pair.name);
          if (pool) {
            const item = res[index];
            t[pair.id] = {
              ...item,
              base: BalancedJs.utils.toIcx(item.base, pool.base.symbol),
              quote: BalancedJs.utils.toIcx(item.quote, pool.quote.symbol),
              total_supply: BalancedJs.utils.toIcx(item.total_supply),
            };
          }
        });

        return t;
      }
    },
  );
};

export const useAllPairsTVL = () => {
  const tvlQuery = useAllPairsTVLQuery();
  const ratesQuery = useRatesQuery();
  const { data: incentivisedPairs } = useIncentivisedPairs();

  if (tvlQuery.isSuccess && ratesQuery.isSuccess && incentivisedPairs) {
    const rates = ratesQuery.data || {};
    const tvls = tvlQuery.data || {};

    const t: { [key in string]: number } = {};
    incentivisedPairs.forEach(pair => {
      const pool = getPoolFromName(pair.name);
      if (pool) {
        const baseTVL = tvls[pair.id] ? tvls[pair.id].base.times(rates[pool.base.symbol!]) : new BigNumber(0);
        const quoteTVL = tvls[pair.id] ? tvls[pair.id].quote.times(rates[pool.quote.symbol!]) : new BigNumber(0);
        t[pair.id] = baseTVL.plus(quoteTVL).integerValue().toNumber();
      }
    });

    return t;
  }

  return;
};

type DataPeriod = '24h' | '30d';

export const useAllPairsDataQuery = (period: DataPeriod = '24h') => {
  const { data: incentivisedPairs } = useIncentivisedPairs();
  return useQuery<{ [key: string]: { base: BigNumber; quote: BigNumber } } | undefined>(
    [`useAllPairs${period}DataQuery`, incentivisedPairs],
    async () => {
      if (incentivisedPairs) {
        const { data } = await axios.get(`${API_ENDPOINT}/stats/dex-pool-stats-${period}`);
        const t = {};

        incentivisedPairs.forEach(pair => {
          const pool = getPoolFromName(pair.name);
          if (pool) {
            const key = `0x${pair.id.toString(16)}`;

            const baseAddress = pool.base.address;
            const quoteAddress = pool.quote.address;

            if (data[key]) {
              t[pair.id] = {};
              // volume
              const _volume = data[key]['volume'];

              t[pair.id]['volume'] = {
                [pool.base.symbol!]: BalancedJs.utils.toIcx(_volume[baseAddress], pool.base.symbol),
                [pool.quote.symbol!]: BalancedJs.utils.toIcx(_volume[quoteAddress], pool.quote.symbol),
              };

              // fees
              const _fees = data[key]['fees'];
              if (_fees[baseAddress]) {
                t[pair.id]['fees'] = {
                  [pool.base.symbol!]: {
                    lp_fees: BalancedJs.utils.toIcx(_fees[baseAddress]['lp_fees'], pool.base.symbol!),
                    baln_fees: BalancedJs.utils.toIcx(_fees[baseAddress]['baln_fees'], pool.base.symbol!),
                  },
                };
              }
              if (_fees[quoteAddress]) {
                t[pair.id]['fees'] = t[pair.id]['fees']
                  ? {
                      ...t[pair.id]['fees'],
                      [pool.quote.symbol!]: {
                        lp_fees: BalancedJs.utils.toIcx(_fees[quoteAddress]['lp_fees'], pool.quote.symbol),
                        baln_fees: BalancedJs.utils.toIcx(_fees[quoteAddress]['baln_fees'], pool.quote.symbol),
                      },
                    }
                  : {
                      [pool.quote.symbol!]: {
                        lp_fees: BalancedJs.utils.toIcx(_fees[quoteAddress]['lp_fees'], pool.quote.symbol),
                        baln_fees: BalancedJs.utils.toIcx(_fees[quoteAddress]['baln_fees'], pool.quote.symbol),
                      },
                    };
              }
            }
          }
        });
        return t;
      }
    },
  );
};

export const useAllPairsData = (
  period: DataPeriod = '24h',
): { [key in string]: { volume: number; fees: number } } | undefined => {
  const dataQuery = useAllPairsDataQuery(period);
  const ratesQuery = useRatesQuery();
  const { data: incentivisedPairs } = useIncentivisedPairs();

  if (dataQuery.isSuccess && ratesQuery.isSuccess && incentivisedPairs) {
    const rates = ratesQuery.data || {};
    const data = dataQuery.data || {};

    const t: { [key in string]: { volume: number; fees: number } } = {};

    try {
      incentivisedPairs
        .filter(pair => data[pair.id])
        .forEach(pair => {
          const pool = getPoolFromName(pair.name);
          if (pool) {
            // volume
            const baseVol = data[pair.id]['volume'][pool.base.symbol].times(rates[pool.base.symbol!]);
            const quoteVol = data[pair.id]['volume'][pool.quote.symbol].times(rates[pool.quote.symbol!]);
            const volume = baseVol.plus(quoteVol).integerValue().toNumber();

            // fees
            const baseFees = data[pair.id]['fees'][pool.base.symbol]
              ? data[pair.id]['fees'][pool.base.symbol]['lp_fees']
                  .plus(data[pair.id]['fees'][pool.base.symbol]['baln_fees'])
                  .times(rates[pool.base.symbol!])
              : new BigNumber(0);

            const quoteFees = data[pair.id]['fees'][pool.quote.symbol]
              ? data[pair.id]['fees'][pool.quote.symbol]['lp_fees']
                  .plus(data[pair.id]['fees'][pool.quote.symbol]['baln_fees'])
                  .times(rates[pool.quote.symbol!])
              : new BigNumber(0);
            const fees = baseFees.plus(quoteFees).integerValue().toNumber();

            t[pair.id] = { volume, fees };
          }
        });
    } catch (e) {
      console.error(e);
    }

    return t;
  }

  return;
};

export const useAllPairsParticipantQuery = () => {
  const { data: incentivisedPairs } = useIncentivisedPairs();
  return useQuery<{ [key: string]: number } | undefined>(
    ['useAllPairsParticipantQuery', incentivisedPairs],
    async () => {
      if (incentivisedPairs) {
        const res: Array<string> = await Promise.all(
          incentivisedPairs.map(pair => bnJs.Dex.totalDexAddresses(pair.id)),
        );

        const t = {};
        incentivisedPairs.forEach((pair, index) => {
          t[pair.id] = parseInt(res[index]);
        });

        return t;
      }
    },
  );
};

export const useAllPairs = () => {
  const apys = useAllPairsAPY();
  const tvls = useAllPairsTVL();
  const data = useAllPairsData();
  const data30day = useAllPairsData('30d');
  const participantQuery = useAllPairsParticipantQuery();
  const { data: incentivisedPairs } = useIncentivisedPairs();

  const t: {
    [key: string]: PoolInfo & {
      tvl: number;
      apy: number;
      feesApy: number;
      apyTotal: number;
      participant?: number;
      volume?: number;
      fees?: number;
    };
  } = {};

  if (apys && participantQuery.isSuccess && tvls && data && data30day && incentivisedPairs) {
    const participants = participantQuery.data;

    incentivisedPairs.forEach(pair => {
      const feesApyConstant = pair.id === 1 ? 0.7 : 0.5;
      const pool = getPoolFromName(pair.name);

      if (pool) {
        t[pair.id] = {
          id: pair.id,
          name: pair.name,
          baseCurrencyKey: pool.base.symbol!,
          quoteCurrencyKey: pool.quote.symbol!,
          baseToken: pool.base,
          quoteToken: pool.quote,
          tvl: tvls[pair.id],
          apy: apys[pair.name]?.toNumber(),
          feesApy: data30day[pair.id] && (data30day[pair.id]['fees'] * 12 * feesApyConstant) / tvls[pair.id],
          participant: participants && participants[pair.id],
          apyTotal:
            data30day[pair.id] &&
            new BigNumber(apys[pair.name] || 0)
              .plus(
                new BigNumber(data30day[pair.id]['fees'] * 12 * feesApyConstant || 0).div(
                  new BigNumber(tvls[pair.id]) || 1,
                ),
              )
              .toNumber(),
        };
      }

      if (data[pair.id]) {
        t[pair.id].volume = data[pair.id]['volume'];
        t[pair.id].fees = data[pair.id]['fees'];
      }
    });
    return t;
  } else return null;
};

export const useAllPairsTotal = () => {
  const allPairs = useAllPairs();

  if (allPairs) {
    return Object.values(allPairs).reduce(
      (total, pair) => {
        total.participant += pair.participant ? pair.participant : 0;
        total.tvl += pair.tvl;
        total.volume += pair.volume ? pair.volume : 0;
        total.fees += pair.fees ? pair.fees : 0;
        return total;
      },
      { participant: 0, tvl: 0, volume: 0, fees: 0 },
    );
  }

  return;
};
