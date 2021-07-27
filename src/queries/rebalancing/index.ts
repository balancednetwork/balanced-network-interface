import axios from 'axios';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { stringify } from 'querystring';
import { useQuery } from 'react-query';

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
  const { account } = useIconReact();
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
