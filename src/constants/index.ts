import BigNumber from 'bignumber.js';

export const ZERO = new BigNumber(0);
export const ONE = new BigNumber(1);
export const PLUS_INFINITY = new BigNumber(1 / 0);
export const MINUS_INFINITY = new BigNumber(-1 / 0);

export const QUINTILLION = new BigNumber('1000000000000000000');
export const TRILLION = new BigNumber('1000000000000');
export const WITHDRAW_LOCK_TIMEOUT = 86400 * 10 ** 6;

export const SLIDER_RANGE_MAX_BOTTOM_THRESHOLD = 0.001;

export const MINIMUM_ICX_FOR_ACTION = 2;
export const MINIMUM_ICX_FOR_TX = 1;

export const DEFAULT_SLIPPAGE = 100;
