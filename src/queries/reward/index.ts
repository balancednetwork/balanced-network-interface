import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useQuery } from 'react-query';

import bnJs from 'bnJs';
import QUERY_KEYS from 'queries/queryKeys';

export const useUserCollectedFeesQuery = (start: number = 0, end: number = 0) => {
  const { account } = useIconReact();

  return useQuery<{ [key in string]: BigNumber }>(
    QUERY_KEYS.Reward.UserCollectedFees(account ?? '', start, end),
    async () => {
      const data = await bnJs.Dividends.getUserDividends(account!, start, end);
      const t = {};
      Object.keys(data).forEach(key => {
        t[key] = BalancedJs.utils.toIcx(data[key]);
      });
      return t;
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
