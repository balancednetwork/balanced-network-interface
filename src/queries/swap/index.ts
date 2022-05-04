import axios from 'axios';
import { BalancedJs } from 'packages/BalancedJs';
import { useQuery } from 'react-query';

import { CHART_PERIODS } from 'app/components/TradingViewChart';
import { getTradePair, isQueue } from 'constants/currency';
import { ONE } from 'constants/index';
import QUERY_KEYS from 'queries/queryKeys';
import { Field } from 'store/swap/actions';
import { Currency } from 'types/balanced-sdk-core';

import { API_ENDPOINT } from '../constants';

const LAUNCH_DAY = 1619398800000000;

type BarType = { time: number; open: number; close: number; high: number; low: number; volume: number };

export const usePriceChartDataQuery = (currencies: { [field in Field]?: Currency }, period: CHART_PERIODS) => {
  return useQuery<BarType[]>(QUERY_KEYS.Swap.PriceChart(currencies, period), async () => {
    const [pair, inverse] = getTradePair(
      currencies[Field.INPUT]?.symbol as string,
      currencies[Field.OUTPUT]?.symbol as string,
    );
    if (pair && !isQueue(pair)) {
      const day = new Date().valueOf() * 1_000;
      const {
        data: result,
      }: {
        data: BarType[];
      } = await axios.get(`${API_ENDPOINT}/dex/swap-chart/${pair?.id}/${period.toLowerCase()}/${LAUNCH_DAY}/${day}`);

      const quoteToken = pair.quoteToken;
      const baseToken = pair.baseToken;

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
