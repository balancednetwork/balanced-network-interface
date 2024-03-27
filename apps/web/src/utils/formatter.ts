import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import numbro from 'numbro';

export type TimeSeries = '1d' | '15m';

const DEFAULT_CURRENCY_DECIMALS = 2;

export type NumberStyle =
  | 'percent0'
  | 'percent1'
  | 'percent2'
  | 'number'
  | 'number2'
  | 'number4'
  | 'currency0'
  | 'currency2'
  | 'price';

export const toBigNumber = (value: number | string): BigNumber => new BigNumber(value);

export const formatCurrency = (value: string | number, decimals: number = DEFAULT_CURRENCY_DECIMALS): string => {
  if (value !== 0 && !value) {
    return '$-.--';
  }

  // always use dollars for now
  return (
    '$' +
    numbro(value).format({
      thousandSeparated: true,
      mantissa: Number.isInteger(value) ? 0 : decimals,
    })
  );
};

export const formatPercentage = (value: string | number, decimals: number = DEFAULT_CURRENCY_DECIMALS): string => {
  return numbro(value).format({
    output: 'percent',
    mantissa: decimals,
  });
};

export const formatNumber = (num: number, mantissa: number = 0, trim = false) =>
  numbro(num).format({ thousandSeparated: true, mantissa, trimMantissa: trim });

export const formatPrice = (value: string | number) => {
  if (value !== 0 && !value) {
    return '$-.--';
  }

  let decimals = 0;

  // @ts-ignore
  if (value < 0.01) {
    decimals = 6;

    // @ts-ignore
  } else if (value < 10) {
    decimals = 4;
  } else {
    decimals = 2;
  }

  // always use dollars for now
  return (
    '$' +
    numbro(value).format({
      thousandSeparated: true,
      mantissa: Number.isInteger(value) ? 0 : decimals,
    })
  );
};

export const getFormattedNumber = (num: number | null, numFormat: NumberStyle) => {
  if (num == null) {
    return null;
  }
  let formattedNum;
  if (numFormat === 'currency0') {
    formattedNum = formatCurrency(num, 0);
  } else if (numFormat === 'currency2') {
    formattedNum = formatCurrency(num, 2);
  } else if (numFormat === 'number') {
    formattedNum = formatNumber(num);
  } else if (numFormat === 'number2') {
    formattedNum = formatNumber(num, 2, true);
  } else if (numFormat === 'number4') {
    formattedNum = formatNumber(num, 4);
  } else if (numFormat === 'percent2') {
    formattedNum = formatPercentage(num);
  } else if (numFormat === 'percent0') {
    formattedNum = formatPercentage(num, 0);
  } else if (numFormat === 'percent1') {
    formattedNum = formatPercentage(num, 1);
  } else if (numFormat === 'price') {
    formattedNum = formatPrice(num);
  }
  return formattedNum;
};

export const formatIdToIsoString = (id: string, timeSeries: TimeSeries) => {
  let multiple = 0;
  if (timeSeries === '1d') {
    multiple = 86400;
  } else if (timeSeries === '15m') {
    multiple = 900;
  }
  const created = new Date(Number(id) * multiple * 1000);
  return created.toISOString();
};

export type TimeSeriesType = '15m' | '1d';

export const formatTime = (created: string | number, type: TimeSeriesType) => {
  if (type === '15m') {
    return dayjs().format('HH:00');
  } else if (type === '1d') {
    return dayjs().format('MM/dd');
  }
  throw new Error('unrecognized time to format');
};

export const formatDate = (created: string) => dayjs().format('PPpp');

export const formatYAxisNumber = (num: number | undefined, digits = 2, round = true) => {
  if (num === 0) return '';
  if (!num) return '-';
  if (num < 0.001 && digits <= 3) {
    return '<0.001';
  }

  return numbro(num)
    .format({
      average: round,
      mantissa: digits,
      abbreviations: {
        million: 'M',
        billion: 'B',
      },
    })
    .toUpperCase();
};

export const formatPriceChange = (percent: number) => {
  if (percent === 0) return '0%';
  return `${percent >= 0 ? '+' : '-'}${getFormattedNumber(Math.abs(percent) / 100, 'percent2')}`;
};
