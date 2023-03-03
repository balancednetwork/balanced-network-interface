import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useQuery } from 'react-query';

import bnJs from 'bnJs';
import QUERY_KEYS from 'queries/queryKeys';

export enum Period {
  'day' = 'day',
  'week' = 'week',
  'month' = 'month',
  'all' = 'all',
}

export function useRebalancingDataQuery_DEPRECATED(period: Period) {
  const { account } = useIconReact();
  return useQuery<{ totalCollateralSold: BigNumber; totalRepaid: BigNumber }>(
    QUERY_KEYS.PositionDetails.Rebalancing(account ?? '', period),
    () => {
      return {
        totalCollateralSold: new BigNumber(0),
        totalRepaid: new BigNumber(0),
      };
    },
    {
      enabled: !!account,
    },
  );
}

const intervalMs = 3000;

export function useRebalancingStatusQuery() {
  return useQuery<boolean>(
    'getRebalancingStatus',
    async () => {
      const res = await bnJs.Rebalancing.getRebalancingStatus();
      if (res[0] === '0x0' && res[2] === '0x0') {
        return false;
      }
      return true;
    },
    {
      refetchInterval: intervalMs,
    },
  );
}
