import { BalancedJs } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount } from '@balancednetwork/sdk-core';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useQuery } from 'react-query';

import bnJs from 'bnJs';
import { PairInfo, SUPPORTED_PAIRS } from 'constants/pairs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import QUERY_KEYS from 'queries/queryKeys';

import { API_ENDPOINT } from '../constants';
import { useBnJsContractQuery } from '../utils';

export const BATCH_SIZE = 30;

export const useUserCollectedFeesQuery = (start: number = 0, end: number = 0) => {
  const { account } = useIconReact();

  return useQuery<({ [address in string]: CurrencyAmount<Currency> } | null)[]>(
    QUERY_KEYS.Reward.UserCollectedFees(account ?? '', start, end),
    async () => {
      const promises: Promise<any>[] = [];
      for (let i = end; i > 1; i -= BATCH_SIZE + 1) {
        const startValue = i - BATCH_SIZE;
        promises.push(bnJs.Dividends.getUserDividends(account!, startValue > 0 ? startValue : 0, i));
      }

      let feesArr = await Promise.all(promises);

      feesArr = feesArr.map(fees => {
        if (!fees) return null;
        if (!Object.values(fees).find(value => !BalancedJs.utils.toIcx(value as string).isZero())) return null;

        const t = Object.keys(fees).reduce((prev, address) => {
          const currency = SUPPORTED_TOKENS_MAP_BY_ADDRESS[address];
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

  return useQuery<BigNumber>(QUERY_KEYS.Reward.UserReward(account ?? ''), async () => {
    const res = await bnJs.Rewards.getBalnHolding(account!);
    return BalancedJs.utils.toIcx(res);
  });
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

export const useAllPairsAPY = (): { [key: number]: BigNumber } | undefined => {
  const tvls = useAllPairsTVL();
  const { data: rates } = useRatesQuery();
  const dailyDistributionQuery = useBnJsContractQuery<string>('Rewards', 'getEmission', [], false);

  if (tvls && rates && dailyDistributionQuery.isSuccess) {
    const dailyDistribution = BalancedJs.utils.toIcx(dailyDistributionQuery.data);
    const t = {};
    SUPPORTED_PAIRS.forEach(pair => {
      t[pair.id] =
        pair.rewards && dailyDistribution.times(pair.rewards).times(365).times(rates['BALN']).div(tvls[pair.id]);
    });
    return t;
  }

  return;
};

export const useAllPairsTVLQuery = () => {
  return useQuery<{ [key: string]: { base: BigNumber; quote: BigNumber; total_supply: BigNumber } }>(
    'useAllPairsTVLQuery',
    async () => {
      const res: Array<any> = await Promise.all(
        SUPPORTED_PAIRS.map(async pair => {
          const { data } = await axios.get(`${API_ENDPOINT}/dex/stats/${pair.id}`);
          return data;
        }),
      );

      const t = {};
      SUPPORTED_PAIRS.forEach((pair, index) => {
        const item = res[index];
        t[pair.id] = {
          ...item,
          base: BalancedJs.utils.toIcx(item.base, pair.baseCurrencyKey),
          quote: BalancedJs.utils.toIcx(item.quote, pair.quoteCurrencyKey),
          total_supply: BalancedJs.utils.toIcx(item.total_supply),
        };
      });

      return t;
    },
  );
};

export const useAllPairsTVL = () => {
  const tvlQuery = useAllPairsTVLQuery();
  const ratesQuery = useRatesQuery();

  if (tvlQuery.isSuccess && ratesQuery.isSuccess) {
    const rates = ratesQuery.data || {};
    const tvls = tvlQuery.data || {};

    const t: { [key in string]: number } = {};
    SUPPORTED_PAIRS.forEach(pair => {
      const baseTVL = tvls[pair.id].base.times(rates[pair.baseCurrencyKey]);
      const quoteTVL = tvls[pair.id].quote.times(rates[pair.quoteCurrencyKey]);
      t[pair.id] = baseTVL.plus(quoteTVL).integerValue().toNumber();
    });

    return t;
  }

  return;
};

export const useAllPairsDataQuery = () => {
  return useQuery<{ [key: string]: { base: BigNumber; quote: BigNumber } }>('useAllPairsDataQuery', async () => {
    const { data } = await axios.get(`${API_ENDPOINT}/stats/dex-pool-stats-24h`);
    const t = {};

    SUPPORTED_PAIRS.forEach(pair => {
      const key = `0x${pair.id.toString(16)}`;

      const baseAddress = pair.baseToken.address;
      const quoteAddress = pair.quoteToken.address;

      if (data[key]) {
        t[pair.id] = {};
        // volume
        const _volume = data[key]['volume'];

        t[pair.id]['volume'] = {
          [pair.baseCurrencyKey]: BalancedJs.utils.toIcx(_volume[baseAddress], pair.baseCurrencyKey),
          [pair.quoteCurrencyKey]: BalancedJs.utils.toIcx(_volume[quoteAddress], pair.quoteCurrencyKey),
        };

        // fees
        const _fees = data[key]['fees'];
        t[pair.id]['fees'] = {
          [pair.baseCurrencyKey]: {
            lp_fees: BalancedJs.utils.toIcx(_fees[baseAddress]['lp_fees'], pair.baseCurrencyKey),
            baln_fees: BalancedJs.utils.toIcx(_fees[baseAddress]['baln_fees'], pair.baseCurrencyKey),
          },
          [pair.quoteCurrencyKey]: {
            lp_fees: BalancedJs.utils.toIcx(_fees[quoteAddress]['lp_fees'], pair.quoteCurrencyKey),
            baln_fees: BalancedJs.utils.toIcx(_fees[quoteAddress]['baln_fees'], pair.quoteCurrencyKey),
          },
        };
      }
    });

    return t;
  });
};

export const useAllPairsData = (): { [key in string]: { volume: number; fees: number } } | undefined => {
  const dataQuery = useAllPairsDataQuery();
  const ratesQuery = useRatesQuery();

  if (dataQuery.isSuccess && ratesQuery.isSuccess) {
    const rates = ratesQuery.data || {};
    const data = dataQuery.data || {};

    const t: { [key in string]: { volume: number; fees: number } } = {};

    SUPPORTED_PAIRS.filter(pair => data[pair.id]).forEach(pair => {
      // volume
      const baseVol = data[pair.id]['volume'][pair.baseCurrencyKey].times(rates[pair.baseCurrencyKey]);
      const quoteVol = data[pair.id]['volume'][pair.quoteCurrencyKey].times(rates[pair.quoteCurrencyKey]);
      const volume = baseVol.plus(quoteVol).integerValue().toNumber();

      // fees
      const baseFees = data[pair.id]['fees'][pair.baseCurrencyKey]['lp_fees']
        .plus(data[pair.id]['fees'][pair.baseCurrencyKey]['baln_fees'])
        .times(rates[pair.baseCurrencyKey]);

      const quoteFees = data[pair.id]['fees'][pair.quoteCurrencyKey]['lp_fees']
        .plus(data[pair.id]['fees'][pair.quoteCurrencyKey]['baln_fees'])
        .times(rates[pair.quoteCurrencyKey]);
      const fees = baseFees.plus(quoteFees).integerValue().toNumber();

      t[pair.id] = { volume, fees };
    });

    return t;
  }

  return;
};

export const useAllPairsParticipantQuery = () => {
  return useQuery<{ [key: string]: number }>('useAllPairsParticipantQuery', async () => {
    const res: Array<string> = await Promise.all(SUPPORTED_PAIRS.map(pair => bnJs.Dex.totalDexAddresses(pair.id)));

    const t = {};
    SUPPORTED_PAIRS.forEach((pair, index) => {
      t[pair.id] = parseInt(res[index]);
    });

    return t;
  });
};

export const useAllPairs = () => {
  const apys = useAllPairsAPY();
  const tvls = useAllPairsTVL();
  const data = useAllPairsData();
  const participantQuery = useAllPairsParticipantQuery();

  const t: {
    [key: string]: PairInfo & { tvl: number; apy: number; participant: number; volume?: number; fees?: number };
  } = {};

  if (apys && participantQuery.isSuccess && tvls && data) {
    const participants = participantQuery.data;

    SUPPORTED_PAIRS.forEach(pair => {
      t[pair.id] = {
        ...pair,
        tvl: tvls[pair.id],
        apy: apys[pair.id]?.toNumber(),
        participant: participants[pair.id],
      };

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
        total.participant += pair.participant;
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
