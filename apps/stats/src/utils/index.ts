import BigNumber from 'bignumber.js';
import { Validator } from 'icon-sdk-js';

const { isEoaAddress } = Validator;

export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

const TEN = new BigNumber(10);

export const NETWORK_ID: number = 1;

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 7): string {
  if (!isEoaAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

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
    default: {
      return `${prefix}/address/${data}`;
    }
  }
}

export function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

export function formatUnits(value: string, decimals: number = 18, fixed: number = 0): string {
  return new BigNumber(value).div(TEN.pow(decimals)).toFixed(fixed);
}

export const LAUNCH_DAY = 1619366400000;
export const ONE_DAY_DURATION = 86400000;
