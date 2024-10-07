import { Fraction, Percent } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';

// 30 minutes, denominated in seconds
export const DEFAULT_DEADLINE_FROM_NOW = 60 * 30;

export const BIGINT_ZERO = 0n;
export const BIGINT_ONE = 1n;
export const ZERO = new BigNumber(0);
export const FRACTION_ZERO = new Fraction(0);
export const FRACTION_ONE = new Fraction(1);

// one basis BigInt
const BIPS_BASE = 10000n;
export const ONE_BIPS = new Percent(1n, BIPS_BASE);

// used for warning states
export const ALLOWED_PRICE_IMPACT_LOW: Percent = new Percent(100n, BIPS_BASE); // 1%
export const ALLOWED_PRICE_IMPACT_MEDIUM: Percent = new Percent(300n, BIPS_BASE); // 3%
export const ALLOWED_PRICE_IMPACT_HIGH: Percent = new Percent(500n, BIPS_BASE); // 5%
// if the price slippage exceeds this number, force the user to type 'confirm' to execute
export const PRICE_IMPACT_WITHOUT_FEE_CONFIRM_MIN: Percent = new Percent(1000n, BIPS_BASE); // 10%
// for non expert mode disable swaps above this
export const BLOCKED_PRICE_IMPACT_NON_EXPERT: Percent = new Percent(1500n, BIPS_BASE); // 15%

export const BETTER_TRADE_LESS_HOPS_THRESHOLD = new Percent(50n, BIPS_BASE);

export const SLIPPAGE_WARNING_THRESHOLD = new Percent(250n, BIPS_BASE); //2.5%
export const SLIPPAGE_MODAL_WARNING_THRESHOLD = new Percent(500n, BIPS_BASE); //5%
export const SLIPPAGE_SWAP_DISABLED_THRESHOLD = new Percent(1000n, BIPS_BASE); //10%

export const ZERO_PERCENT = new Percent('0');
export const TWO_PERCENT = new Percent(200n, BIPS_BASE);
export const ONE_HUNDRED_PERCENT = new Percent('1');

// transaction popup dismissal amounts
export const DEFAULT_TXN_DISMISS_MS = 15000;
