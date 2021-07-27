import axios from 'axios';
import { BalancedJs } from 'packages/BalancedJs';
import { useQuery } from 'react-query';

import { CHART_PERIODS } from 'app/components/TradingViewChart';
import { getTradePair, isQueue } from 'constants/currency';
import { ONE } from 'constants/index';
import QUERY_KEYS from 'queries/queryKeys';
import { Field } from 'store/swap/actions';
import { CurrencyKey } from 'types';

import { API_ENDPOINT } from '../constants';

const LAUNCH_DAY = 1619398800000000;

export const usePriceChartDataQuery = (currencyKeys: { [field in Field]?: CurrencyKey }, period: CHART_PERIODS) => {
  return useQuery<{ time: number; open: number; close: number; high: number; low: number; volume: number }[]>(
    QUERY_KEYS.Swap.PriceChart(currencyKeys, period),
    async () => {
      const [pair, inverse] = getTradePair(currencyKeys[Field.INPUT] as string, currencyKeys[Field.OUTPUT] as string);
      if (pair && !isQueue(pair)) {
        const day = new Date().valueOf() * 1_000;
        const {
          data: result,
        }: {
          data: { time: number; open: number; close: number; high: number; low: number; volume: number }[];
        } = await axios.get(
          `${API_ENDPOINT}/dex/swap-chart/${pair?.poolId}/${period.toLowerCase()}/${LAUNCH_DAY}/${day}`,
        );

        let data1;

        if (!inverse) {
          data1 = result.map(item => ({
            time: item.time / 1_000_000,
            value: BalancedJs.utils.toIcx(item.close).toNumber(),
            open: BalancedJs.utils.toIcx(item.open).toNumber(),
            close: BalancedJs.utils.toIcx(item.close).toNumber(),
            high: BalancedJs.utils.toIcx(item.high).toNumber(),
            low: BalancedJs.utils.toIcx(item.low).toNumber(),
            volume: BalancedJs.utils.toIcx(item.volume).toNumber(),
          }));
        } else {
          data1 = result.map(item => ({
            time: item.time / 1_000_000,
            value: ONE.div(BalancedJs.utils.toIcx(item.close)).toNumber(),
            open: ONE.div(BalancedJs.utils.toIcx(item.open)).toNumber(),
            close: ONE.div(BalancedJs.utils.toIcx(item.close)).toNumber(),
            high: ONE.div(BalancedJs.utils.toIcx(item.high)).toNumber(),
            low: ONE.div(BalancedJs.utils.toIcx(item.low)).toNumber(),
            volume: BalancedJs.utils.toIcx(item.volume).toNumber(),
          }));
        }
        return data1;
      }

      return [];
    },
  );
};
