import { Fraction, Percent } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';

// 30 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 30;

export const BIGINT_ZERO = JSBI.BigInt(0);
export const BIGINT_ONE = JSBI.BigInt(1);
export const ZERO = new BigNumber(0);
export const FRACTION_ZERO = new Fraction(0);
export const FRACTION_ONE = new Fraction(1);

// one basis JSBI.BigInt
const BIPS_BASE = JSBI.BigInt(10000);
export const ONE_BIPS = new Percent(JSBI.BigInt(1), BIPS_BASE);

// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(JSBI.BigInt(100), BIPS_BASE); // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(JSBI.BigInt(300), BIPS_BASE); // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(JSBI.BigInt(500), BIPS_BASE); // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(JSBI.BigInt(1000), BIPS_BASE); // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(JSBI.BigInt(1500), BIPS_BASE); // 15%

export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(JSBI.BigInt(50), BIPS_BASE);

export const SLIPPAGE_WARNING_THRESHOLD = new Percent(JSBI.BigInt(250), BIPS_BASE); //2.5%

export const ZERO_PERCENT = new Percent('0');
export const TWO_PERCENT = new Percent(JSBI.BigInt(200), BIPS_BASE);
export const ONE_HUNDRED_PERCENT = new Percent('1');

// transaction popup dismissal amounts
export const DEFAULT_TXN_DISMISS_MS = 15000;
