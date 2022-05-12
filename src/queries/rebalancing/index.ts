import axios from 'axios';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { BalancedJs } from 'packages/BalancedJs';
import { stringify } from 'querystring';
import { useQuery } from 'react-query';

import bnJs from 'bnJs';
import QUERY_KEYS from 'queries/queryKeys';

import { API_ENDPOINT } from '../constants';

export enum Period {
  'day' = 'day',
  'week' = 'week',
  'month' = 'month',
  'all' = 'all',
}

const getTimestamp = (period: Period) => {
  let timestamp = 0; // all
  switch (period) {
    case Period.day:
      timestamp = dayjs().subtract(1, 'day').valueOf();
      break;
    case Period.week:
      timestamp = dayjs().subtract(1, 'week').valueOf();
      break;
    case Period.month:
      timestamp = dayjs().subtract(1, 'month').valueOf();
      break;
    default:
  }

  return timestamp * 1000; // convert to microsecond
};

export function useRebalancingDataQuery(period: Period) {
  const { account } = { account: 'cxee1fa51a14783577bc4b900c13579b9bcb0b55f5' };
  return useQuery<{ totalCollateralSold: BigNumber; totalRepaid: BigNumber }>(
    QUERY_KEYS.PositionDetails.Rebalancing(account ?? '', period),
    async () => {
      const params = {
        address: account,
        token_symbol: 'bnUSD',
        from_timestamp: getTimestamp(period),
      };

      const res = await axios.get(`${API_ENDPOINT}/stats/rebalanced?${stringify(params)}`);

      const { loan_repaid, collateral_sold } = res.data || {};

      return {
        totalCollateralSold: BalancedJs.utils.toIcx(new BigNumber(collateral_sold)),
        totalRepaid: BalancedJs.utils.toIcx(new BigNumber(loan_repaid)),
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
