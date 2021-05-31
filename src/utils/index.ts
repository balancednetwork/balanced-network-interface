import BigNumber from 'bignumber.js';
import { isEoaAddress } from 'icon-sdk-js/lib/data/Validator.js';
import { NetworkId, NETWORK_ID } from 'packages/icon-react';

import { currencyKeyToIconMap } from 'constants/currency';
import { MINIMUM_ICX_AMOUNT_IN_WALLET, ZERO } from 'constants/index';
import { CurrencyKey, CurrencyAmount } from 'types';

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 7): string {
  if (!isEoaAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

const API_ENDPOINTS = {
  [NetworkId.MAINNET]: 'https://balnmainnet.techiast.com:8069',
  [NetworkId.YEOUIDO]: 'https://balanced.techiast.com:8069',
};

export const getAPIEnpoint = () => API_ENDPOINTS[NETWORK_ID];

const Trackers = {
  [NetworkId.MAINNET]: 'https://tracker.icon.foundation',
  [NetworkId.YEOUIDO]: 'https://bicon.tracker.solidwallet.io',
};

export function getTrackerLink(
  networkId: NetworkId,
  data: string,
  type: 'transaction' | 'token' | 'address' | 'block',
): string {
  const prefix = Trackers[networkId];

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
        if (value.isLessThan(new BigNumber(1))) {
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

export const getCurrencyKeyIcon = (currencyKey: CurrencyKey) => currencyKeyToIconMap[currencyKey];

export function maxAmountSpend(currencyAmount?: CurrencyAmount): CurrencyAmount | undefined {
  if (!currencyAmount) return undefined;
  if (currencyAmount.currencyKey === 'ICX') {
    if (currencyAmount.amount.isGreaterThan(MINIMUM_ICX_AMOUNT_IN_WALLET)) {
      return new CurrencyAmount(currencyAmount.currencyKey, currencyAmount.amount.minus(MINIMUM_ICX_AMOUNT_IN_WALLET));
    } else {
      return new CurrencyAmount(currencyAmount.currencyKey, ZERO);
    }
  }
  return currencyAmount;
}

export function formatPercent(percent: BigNumber | undefined) {
  if (!percent) return '0%';
  if (percent.isZero()) return '0%';
  else return percent.times(100).isLessThan(0.01) ? '<0.01%' : `${percent.times(100).dp(2).toFixed()}%`;
}
