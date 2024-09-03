import { useIconReact } from '@/packages/icon-react';
import { useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import QUERY_KEYS from '@/queries/queryKeys';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

export enum Period {
  day = 'day',
  week = 'week',
  month = 'month',
  all = 'all',
}

export function useRebalancingDataQuery_DEPRECATED(period: Period) {
  const { account } = useIconReact();
  return useQuery<{ totalCollateralSold: BigNumber; totalRepaid: BigNumber }>({
    queryKey: QUERY_KEYS.PositionDetails.Rebalancing(account ?? '', period),
    queryFn: () => {
      return {
        totalCollateralSold: new BigNumber(0),
        totalRepaid: new BigNumber(0),
      };
    },
    enabled: !!account,
  });
}

const intervalMs = 3000;

export function useRebalancingStatusQuery() {
  return useQuery<boolean>({
    queryKey: ['getRebalancingStatus'],
    queryFn: async () => {
      const res = await bnJs.Rebalancing.getRebalancingStatus();
      if (res[0] === '0x0' && res[2] === '0x0') {
        return false;
      }
      return true;
    },
    refetchInterval: intervalMs,
  });
}
