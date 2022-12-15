import { BalancedJs } from '@balancednetwork/balanced-js';
import { Currency, Token } from '@balancednetwork/sdk-core';
import axios from 'axios';
import { useQuery } from 'react-query';

import { CHART_PERIODS } from 'app/components/TradingViewChart';
import bnJs from 'bnJs';
import { ONE } from 'constants/index';
import QUERY_KEYS from 'queries/queryKeys';
import { Field } from 'store/swap/actions';

import { API_ENDPOINT } from '../constants';

const LAUNCH_DAY = 1619398800000000;

type BarType = { time: number; open: number; close: number; high: number; low: number; volume: number };

export const usePriceChartDataQuery = (currencies: { [field in Field]?: Currency }, period: CHART_PERIODS) => {
  return useQuery<BarType[]>(QUERY_KEYS.Swap.PriceChart(currencies, period), async () => {
    const data = await bnJs.Dex.getPoolStatsForPair(
      (currencies[Field.INPUT] as Token)?.address,
      (currencies[Field.OUTPUT] as Token)?.address,
    );

    const pairId = parseInt(data.id);
    const inverse = data.base_token !== (currencies[Field.INPUT] as Token)?.address;

    // the first pair is sICX/ICX pair
    if (data && data.id > 1) {
      const day = new Date().valueOf() * 1_000;
      const {
        data: result,
      }: {
        data: BarType[];
      } = await axios.get(`${API_ENDPOINT}/dex/swap-chart/${pairId}/${period.toLowerCase()}/${LAUNCH_DAY}/${day}`);

      const baseToken = inverse ? currencies[Field.OUTPUT] : currencies[Field.INPUT];
      const quoteToken = inverse ? currencies[Field.INPUT] : currencies[Field.OUTPUT];

      const decimal = (quoteToken?.decimals ?? 0) - (baseToken?.decimals ?? 0) + 18;

      return result.map(bar => formatBarItem(bar, decimal, !!inverse));
    }

    return [];
  });
};

export const formatBarItem = (
  bar: BarType,
  decimal: number,
  isPairInverted: boolean,
  timeFormatConstant: number = 1_000_000,
): BarType => {
  const formattedBar = isPairInverted
    ? {
        time: bar.time / timeFormatConstant,
        value: ONE.div(BalancedJs.utils.toFormat(bar.close, decimal)).toNumber(),
        open: ONE.div(BalancedJs.utils.toFormat(bar.open, decimal)).toNumber(),
        close: ONE.div(BalancedJs.utils.toFormat(bar.close, decimal)).toNumber(),
        high: ONE.div(BalancedJs.utils.toFormat(bar.high, decimal)).toNumber(),
        low: ONE.div(BalancedJs.utils.toFormat(bar.low, decimal)).toNumber(),
        volume: ONE.div(BalancedJs.utils.toIcx(bar.volume)).toNumber(),
      }
    : {
        time: bar.time / timeFormatConstant,
        value: BalancedJs.utils.toFormat(bar.close, decimal).toNumber(),
        open: BalancedJs.utils.toFormat(bar.open, decimal).toNumber(),
        close: BalancedJs.utils.toFormat(bar.close, decimal).toNumber(),
        high: BalancedJs.utils.toFormat(bar.high, decimal).toNumber(),
        low: BalancedJs.utils.toFormat(bar.low, decimal).toNumber(),
        volume: BalancedJs.utils.toIcx(bar.volume).toNumber(),
      };
  return formattedBar;
};
