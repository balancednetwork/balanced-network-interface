import axios from 'axios';
import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useQuery } from 'react-query';

import bnJs from 'bnJs';
import { addressToCurrencyKeyMap } from 'constants/currency';
import { SUPPORTED_PAIRS } from 'constants/pairs';
import QUERY_KEYS from 'queries/queryKeys';

import { API_ENDPOINT } from '../constants';

export const BATCH_SIZE = 50;

export const useUserCollectedFeesQuery = (start: number = 0, end: number = 0) => {
  const { account, networkId } = useIconReact();

  return useQuery<({ [key in string]: BigNumber } | null)[]>(
    QUERY_KEYS.Reward.UserCollectedFees(account ?? '', start, end),
    async () => {
      const promises: Promise<any>[] = [];
      for (let i = 0; i < end; i += BATCH_SIZE) {
        promises.push(bnJs.Dividends.getUserDividends(account!, i, i + BATCH_SIZE < end ? i + BATCH_SIZE : 0));
      }

      let feesArr = await Promise.all(promises);

      feesArr = feesArr.map(fees => {
        if (!Object.values(fees).find(value => !BalancedJs.utils.toIcx(value as string).isZero())) return null;

        const t = {};
        Object.keys(fees).forEach(key => {
          t[key] = BalancedJs.utils.toIcx(fees[key], addressToCurrencyKeyMap[networkId][key]);
        });
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

export const useBnJsContractQuery = <T>(bnJs: BalancedJs, contract: string, method: string, args: any[]) => {
  return useQuery<T, string>(QUERY_KEYS.BnJs(contract, method, args), async () => {
    return bnJs[contract][method](...args);
  });
};

export const useAllPairsAPY = () => {
  const tvls = useAllPairsTVL();
  const { data: rates } = useRatesQuery();
  const dailyDistributionQuery = useBnJsContractQuery<string>(bnJs, 'Rewards', 'getEmission', []);

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
