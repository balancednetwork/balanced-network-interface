import BigNumber from 'bignumber.js';
import { isEoaAddress, isScoreAddress } from 'icon-sdk-js/lib/data/Validator.js';
import JSBI from 'jsbi';
import { BalancedJs } from 'packages/BalancedJs';
import { CHAIN_INFO, SupportedChainId as NetworkId } from 'packages/BalancedJs/chain';

import { MINIMUM_ICX_FOR_ACTION, ONE } from 'constants/index';
import { PairInfo } from 'constants/pairs';
import { Field } from 'store/swap/actions';
import { Currency, CurrencyAmount } from 'types/balanced-sdk-core';

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 7): string {
  if (!isEoaAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

export function getTrackerLink(
  networkId: NetworkId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block',
): string {
  const prefix = CHAIN_INFO[networkId].tracker;

  switch (type) {
    case 'transaction': {
      return `${prefix}/transaction/${data}`;
    }
    case 'token': {
      return `${prefix}/token/${data}`;
    }
    case 'block': {
      return `${prefix}/block/${data}`;
    }
    case 'address':
    default: {
      return `${prefix}/address/${data}`;
    }
  }
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function formatBigNumber(value: BigNumber | undefined, type: 'currency' | 'ratio' | 'input' | 'price') {
  if (value === undefined || value.isNaN() || value.isEqualTo(0)) {
    return '0';
  } else {
    switch (type) {
      case 'currency': {
        if (value.isLessThan(new BigNumber(1)) && value.isGreaterThanOrEqualTo(new BigNumber(0))) {
          return value.precision(2, BigNumber.ROUND_DOWN).toString();
        } else {
          return value.dp(2).toFormat();
        }
      }
      case 'input': {
        if (value.decimalPlaces() === 0) {
          return value.toFixed(0, BigNumber.ROUND_UP);
        } else if (value.isLessThan(new BigNumber(1))) {
          return value.precision(2, BigNumber.ROUND_DOWN).toString();
        } else {
          return value.toFixed(2, BigNumber.ROUND_DOWN);
        }
      }
      case 'ratio': {
        if (value.decimalPlaces() === 0) {
          return value.toFormat(0, BigNumber.ROUND_UP);
        } else {
          return value.toFixed(4, 1);
        }
      }
      case 'price': {
        return value.dp(4).toFormat();
      }
    }
  }
}

const MIN_NATIVE_CURRENCY_FOR_GAS: JSBI = JSBI.multiply(
  JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18)),
  JSBI.BigInt(MINIMUM_ICX_FOR_ACTION),
); // 2 ICX

export function maxAmountSpend(currencyAmount?: CurrencyAmount<Currency>): CurrencyAmount<Currency> | undefined {
  if (!currencyAmount) return undefined;
  if (currencyAmount.currency.symbol === 'ICX') {
    if (JSBI.greaterThan(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS)) {
      return CurrencyAmount.fromRawAmount(
        currencyAmount.currency,
        JSBI.subtract(currencyAmount.quotient, MIN_NATIVE_CURRENCY_FOR_GAS),
      );
    } else {
      return CurrencyAmount.fromRawAmount(currencyAmount.currency, JSBI.BigInt(0));
    }
  }
  return currencyAmount;
}

export function formatPercent(percent: BigNumber | undefined) {
  if (!percent) return '0%';
  if (percent.isZero()) return '0%';
  else return percent.isLessThan(0.01) ? '<0.01%' : `${percent.dp(2).toFixed()}%`;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const LAUNCH_DAY = 1619366400000;
const ONE_DAY_DURATION = 86400000;

export const generateChartData = (rate: BigNumber, currencies: { [field in Field]?: Currency }) => {
  const today = new Date().valueOf();
  const platformDays = Math.floor((today - LAUNCH_DAY) / ONE_DAY_DURATION) + 1;
  const stop = BalancedJs.utils.toLoop(rate);
  const start = BalancedJs.utils.toLoop(ONE);
  const step = stop.minus(start).div(platformDays - 1);

  let _data;

  if (currencies[Field.INPUT]?.symbol === 'sICX' && currencies[Field.OUTPUT]?.symbol === 'ICX') {
    _data = Array(platformDays)
      .fill(start)
      .map((x, index) => ({
        time: (LAUNCH_DAY + ONE_DAY_DURATION * index) / 1_000,
        value: BalancedJs.utils.toIcx(x.plus(step.times(index))).toNumber(),
      }));
  } else {
    _data = Array(platformDays)
      .fill(start)
      .map((x, index) => ({
        time: (LAUNCH_DAY + ONE_DAY_DURATION * index) / 1_000,
        value: ONE.div(BalancedJs.utils.toIcx(x.plus(step.times(index)))).toNumber(),
      }));
  }

  return _data;
};

export const normalizeContent = (text: string): string => {
  const regex = /[\n\r]/g;
  const t = text.replaceAll(regex, ' ');
  return t.substring(0, 248) + '...';
};

const TEN = new BigNumber(10);

export function parseUnits(value: string, decimals: number = 18): string {
  return new BigNumber(value).times(TEN.pow(decimals)).toFixed();
}

export function formatUnits(value: string, decimals: number): string {
  return new BigNumber(value).div(TEN.pow(decimals)).toFixed();
}

export function getPairName(pair: PairInfo) {
  return `${pair.baseCurrencyKey} / ${pair.quoteCurrencyKey}`;
}

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  return isScoreAddress(value) ? value : false;
}
