import { Currency, Token } from '@balancednetwork/sdk-core';
import axios from 'axios';
import { useQuery } from 'react-query';

import { CHART_PERIODS } from 'app/components/TradingViewChart';
import bnJs from 'bnJs';
import { ONE } from 'constants/index';
import QUERY_KEYS from 'queries/queryKeys';
import { Field } from 'store/swap/actions';

import { API_ENDPOINT } from '../constants';

const LAUNCH_DAY = 1619398800;

type BarType = { time: number; open: number; close: number; high: number; low: number; volume: number };
type BarTypeRaw = {
  timestamp: number;
  open: number;
  close: number;
  high: number;
  low: number;
  base_volume: number;
  quote_volume: number;
};

function getPeriodDuration(period: CHART_PERIODS): number {
  switch (period) {
    case '15m':
      return 60000 * 15;
    case '1H':
      return 3600000;
    case '4H':
      return 3600000 * 4;
    case '1D':
      return 3600000 * 24;
    case '1W':
      return 3600000 * 24 * 7;
    default:
      return 3600000 * 24;
  }
}

function getStartTimestampBasedOnPeriod(period: CHART_PERIODS, end: number) {
  const seriesLength = 500;
  const periodDuration = getPeriodDuration(period) / 1000;
  const startTimestamp = end - seriesLength * periodDuration;

  return Math.max(LAUNCH_DAY, startTimestamp);
}

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
      const now = Math.floor(new Date().getTime() / 1000);
      const start = getStartTimestampBasedOnPeriod(period, now);
      const {
        data: result,
      }: {
        data: BarTypeRaw[];
      } = await axios.get(`${API_ENDPOINT}/pools/series/${pairId}/${period.toLowerCase()}/${start}/${now}`);

      const baseToken = inverse ? currencies[Field.OUTPUT] : currencies[Field.INPUT];
      const quoteToken = inverse ? currencies[Field.INPUT] : currencies[Field.OUTPUT];

      const decimal = (quoteToken?.decimals ?? 0) - (baseToken?.decimals ?? 0) + 18;

      return result.map(bar => formatBarItem(bar, decimal, !!inverse));
    }

    return [];
  });
};

export const formatBarItem = (
  bar: BarTypeRaw,
  decimal: number,
  isPairInverted: boolean,
  timeFormatConstant: number = 1,
): BarType => {
  const formattedBar = isPairInverted
    ? {
        time: bar.timestamp * timeFormatConstant,
        value: ONE.div(bar.close).toNumber(),
        open: ONE.div(bar.open, decimal).toNumber(),
        close: ONE.div(bar.close, decimal).toNumber(),
        high: ONE.div(bar.high, decimal).toNumber(),
        low: ONE.div(bar.low, decimal).toNumber(),
        volume: ONE.div(bar.base_volume).toNumber(),
      }
    : {
        time: bar.timestamp * timeFormatConstant,
        value: bar.close,
        open: bar.open,
        close: bar.close,
        high: bar.high,
        low: bar.low,
        volume: bar.base_volume,
      };
  return formattedBar;
};
