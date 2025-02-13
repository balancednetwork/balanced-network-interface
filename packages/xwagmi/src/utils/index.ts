import { xChainMap } from '@/constants/xChains';
import { allXTokens, wICX, xTokenMap } from '@/constants/xTokens';
import { Currency, CurrencyAmount, Token } from '@balancednetwork/sdk-core';
import { RLP } from '@ethereumjs/rlp';
import BigNumber from 'bignumber.js';
import { XChainId, XToken } from '../types';
export * from './address';

// Function to get the last i bytes of an integer
function lastBytesOf(x: bigint, i: number): Uint8Array {
  const buffer = new ArrayBuffer(i);
  const view = new DataView(buffer);
  for (let j = 0; j < i; j++) {
    view.setUint8(j, Number((x >> BigInt(8 * (i - j - 1))) & BigInt(0xff)));
  }
  return new Uint8Array(buffer);
}

// Function to convert an unsigned integer to bytes
export function uintToBytes(x: bigint): Uint8Array {
  if (x === BigInt(0)) {
    return new Uint8Array([0]);
  }
  let right = BigInt(0x80);
  for (let i = 1; i < 32; i++) {
    if (x < right) {
      return lastBytesOf(x, i);
    }
    right <<= BigInt(8);
  }
  if (x < right) {
    return RLP.encode(x);
  } else {
    const data = RLP.encode(x);
    data[0] = 0;
    return data;
  }
}

export function formatBigNumber(value: BigNumber | undefined, type: 'currency' | 'ratio' | 'input' | 'price') {
  if (value === undefined || value.isNaN() || value.isEqualTo(0)) {
    return '0';
  } else {
    switch (type) {
      case 'currency': {
        if (value.isLessThan(new BigNumber(0.00001)) && value.isGreaterThanOrEqualTo(new BigNumber(0))) {
          return value.dp(8, BigNumber.ROUND_DOWN).toFormat();
        } else {
          return value.dp(5, BigNumber.ROUND_DOWN).toFormat();
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
          return value.toFixed(4, BigNumber.ROUND_DOWN);
        }
      }
      case 'price': {
        return value.dp(4).toFormat();
      }
    }
  }
}

export const getNetworkDisplayName = (chain: XChainId) => {
  return xChainMap[chain].name;
};

export const ONE_DAY_DURATION = 86400000;

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function toDec(value?: CurrencyAmount<Currency> | CurrencyAmount<Token>): string {
  return value ? value.quotient.toString() : '0';
}

export const showMessageOnBeforeUnload = e => {
  e.preventDefault();
  window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  e.returnValue = 'Your transaction will be canceled, and you’ll need to sign in again.';
  return e.returnValue;
};

export const getTrackerLink = (
  xChainId: XChainId,
  data: string,
  type: 'transaction' | 'address' | 'block' | 'contract' = 'transaction',
) => {
  const tracker = xChainMap[xChainId].tracker;

  switch (type) {
    case 'transaction': {
      return `${tracker.tx}/${data}`;
    }
    case 'address': {
      return ``;
    }
    case 'block': {
      return ``;
    }
    default: {
      return ``;
    }
  }
};

export const jsonStorageOptions: {
  reviver?: (key: string, value: unknown) => unknown;
  replacer?: (key: string, value: unknown) => unknown;
} = {
  reviver: (_key: string, value: unknown) => {
    if (!value) return value;

    if (typeof value === 'string' && value.startsWith('BIGINT::')) {
      return BigInt(value.substring(8));
    }

    // @ts-ignore
    if (value && value.type === 'bigint') {
      // @ts-ignore
      return BigInt(value.value);
    }

    // @ts-ignore
    if (value && value.type === 'CurrencyAmount') {
      // @ts-ignore
      return CurrencyAmount.fromRawAmount(allXTokens.find(t => t.id === value.value.tokenId)!, value.value.quotient);
    }
    return value;
  },
  replacer: (_key: unknown, value: unknown) => {
    if (typeof value === 'bigint') {
      return { type: 'bigint', value: value.toString() };
    }

    if (value instanceof CurrencyAmount) {
      return {
        type: 'CurrencyAmount',
        value: {
          tokenId: value.currency.id,
          quotient: value.quotient.toString(),
        },
      };
    }

    return value;
  },
};

export const convertCurrencyAmount = (
  xChainId: XChainId,
  amount: CurrencyAmount<Currency | XToken>,
): CurrencyAmount<XToken> => {
  const token = convertCurrency(xChainId, amount.currency);

  if (!token) {
    throw new Error(`XToken ${amount.currency.symbol} is not supported on ${xChainId}`);
  }

  return CurrencyAmount.fromRawAmount(
    token,
    new BigNumber(amount.toFixed()).times((10n ** BigInt(token.decimals)).toString()).toFixed(0),
  );
};

export const convertCurrency = (xChainId: XChainId, currency: Currency | XToken | undefined): XToken | undefined => {
  if (!currency) return undefined;

  if (currency.symbol === 'wICX') return wICX;

  const token = xTokenMap[xChainId].find(t => t.symbol === currency.symbol)!;

  if (!token) {
    return undefined;
    // throw new Error(`XToken ${currency.symbol} is not supported on ${xChainId}`);
  }

  return token;
};

export const findXTokenById = (id: string): XToken | undefined => {
  if (id === wICX.id) return wICX;

  return allXTokens.find(t => t.id === id);
};
