import { BalancedJs, LOOP, CHAIN_INFO, SupportedChainId as NetworkId } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';
import { Validator } from 'icon-sdk-js';
import JSBI from 'jsbi';

import { NETWORK_ID } from 'constants/config';
import { canBeQueue } from 'constants/currency';
import { MINIMUM_ICX_FOR_ACTION, ONE } from 'constants/index';
import { BIGINT_ZERO } from 'constants/misc';
import { PairInfo } from 'constants/pairs';
import { COMBINED_TOKENS_LIST } from 'constants/tokens';
import { PairData, PairState } from 'hooks/useV2Pairs';
import { Field } from 'store/swap/actions';

const { isEoaAddress, isScoreAddress } = Validator;

const isArchEoaAddress = (address: string) => {
  return address.startsWith('archway');
};

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 7): string {
  if (!isEoaAddress(address) && !isArchEoaAddress(address)) {
    throw Error(`Invalid 'address' parameter '${address}'.`);
  }
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
}

export function shortenSCOREAddress(address: string, chars = 7): string {
  if (!isScoreAddress(address)) {
    console.error(`Invalid 'address' parameter '${address}'.`);
    return '';
  }
  return `${address.substring(0, chars + 2)}...${address.substring(42 - chars)}`;
}

export function getTrackerLink(
  networkId: NetworkId,
  data: string,
  type: 'transaction' | 'address' | 'block' | 'contract',
): string {
  const prefix = CHAIN_INFO[networkId].tracker;

  switch (type) {
    case 'transaction': {
      return `${prefix}/transaction/${data}`;
    }
    case 'address': {
      return `${prefix}/address/${data}`;
    }
    case 'block': {
      return `${prefix}/block/${data}`;
    }
    case 'contract':
    default: {
      return `${prefix}/contract/${data}`;
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
  else return percent.isLessThan(0.01) ? '<0.01%' : `${percent.dp(2, BigNumber.ROUND_HALF_UP).toFixed()}%`;
}

export function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// export const LAUNCH_DAY = NETWORK_ID === 1 ? 1619366400000 : 1648742400000;
export const LAUNCH_DAY = NETWORK_ID === 1 ? 1619366400000 : 1667145600000;
export const ONE_DAY_DURATION = 86400000;

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

export const normalizeContent = (text: string, maxLength = 248): string => {
  const regex = /[\n\r]/g;
  const t = text.replaceAll(regex, ' ');
  return t.substring(0, maxLength) + (t.length > maxLength ? '...' : '');
};

const TEN = new BigNumber(10);

export function parseUnits(value: string, decimals: number = 18): string {
  return new BigNumber(value).times(TEN.pow(decimals)).toFixed(0);
}

export function formatUnits(value: string, decimals: number = 18, fixed: number = 0): string {
  return new BigNumber(value).div(TEN.pow(decimals)).toFixed(fixed);
}

export function getPairName(pair: PairInfo) {
  return `${pair.baseCurrencyKey} / ${pair.quoteCurrencyKey}`;
}

/**
 * @returns ICX/sICX pair
 * @param {tokenA} ICX
 * @param {tokenB} sICX
 *  */
export function getQueuePair(stats, tokenA: Token, tokenB: Token) {
  const rate = new BigNumber(stats['price'], 16).div(LOOP);

  const icxSupply = new BigNumber(stats['total_supply'], 16);
  const sicxSupply = icxSupply.div(rate);

  const totalSupply = icxSupply.toFixed();

  const [ICX, sICX] = tokenA.symbol === 'ICX' ? [tokenA, tokenB] : [tokenB, tokenA];

  const minQuoteTokenAmount = BalancedJs.utils.toFormat(new BigNumber(stats['min_quote'], 16), stats['quote_decimals']);

  // ICX/sICX
  const pair: [PairState, Pair, BigNumber] = [
    PairState.EXISTS,
    new Pair(
      CurrencyAmount.fromRawAmount(ICX, totalSupply),
      CurrencyAmount.fromRawAmount(sICX, sicxSupply.toFixed(0)),
      {
        poolId: BalancedJs.utils.POOL_IDS.sICXICX,
        totalSupply,
      },
    ),
    minQuoteTokenAmount,
  ];

  return pair;
}

export function getPair(stats, tokenA: Token, tokenB: Token): PairData {
  if (canBeQueue(tokenA, tokenB)) return getQueuePair(stats, tokenA, tokenB);

  const poolId = parseInt(stats['id'], 16);
  if (poolId === 0) return [PairState.NOT_EXISTS, null, null];

  const baseReserve = new BigNumber(stats['base'], 16).toFixed();
  const quoteReserve = new BigNumber(stats['quote'], 16).toFixed();
  const totalSupply = new BigNumber(stats['total_supply'], 16).toFixed();
  const minQuoteTokenAmount = BalancedJs.utils.toFormat(new BigNumber(stats['min_quote'], 16), stats['quote_decimals']);

  const [reserveA, reserveB] =
    stats['base_token'] === tokenA.address ? [baseReserve, quoteReserve] : [quoteReserve, baseReserve];

  return [
    PairState.EXISTS,
    new Pair(CurrencyAmount.fromRawAmount(tokenA, reserveA), CurrencyAmount.fromRawAmount(tokenB, reserveB), {
      poolId,
      totalSupply,
      baseAddress: stats['base_token'],
    }),
    minQuoteTokenAmount,
  ];
}

// returns the checksummed address if the address is valid, otherwise returns false
export function isAddress(value: any): string | false {
  return isScoreAddress(value) ? value : false;
}

export function toDec(value?: CurrencyAmount<Currency> | CurrencyAmount<Token>): string {
  return value ? value.quotient.toString() : '0';
}

export function toHex(value?: CurrencyAmount<Currency> | CurrencyAmount<Token>): string {
  return value ? `0x${value.quotient.toString(16)}` : '0x0';
}

export function toCurrencyAmount(token: Token, amount: BigNumber): CurrencyAmount<Token> {
  const [amountNum, amountDeno] = amount.toFraction();
  return CurrencyAmount.fromFractionalAmount(
    token,
    amountNum.times(TEN.pow(token.decimals)).toFixed(),
    amountDeno.toFixed(),
  );
}

export function toCurrencyAmountFromRawBN(token: Token, amount: BigNumber): CurrencyAmount<Token> {
  const [amountNum, amountDeno] = amount.toFraction();
  return CurrencyAmount.fromFractionalAmount(token, amountNum.toFixed(), amountDeno.toFixed());
}

export function toFraction(amount: BigNumber | undefined): Fraction {
  const [amountNum, amountDeno] = amount ? amount.toFraction() : [0, 1];
  return new Fraction(amountNum.toFixed(), amountDeno.toFixed());
}

export function multiplyCABN(ca: CurrencyAmount<Currency>, bn: BigNumber): CurrencyAmount<Currency> {
  const bnFrac = toFraction(bn);
  return CurrencyAmount.fromFractionalAmount(
    ca.currency,
    JSBI.multiply(ca.numerator, bnFrac.numerator),
    JSBI.multiply(ca.denominator, bnFrac.denominator),
  );
}

export function isZeroCA(ca: CurrencyAmount<Currency>): boolean {
  return JSBI.equal(ca.quotient, BIGINT_ZERO);
}

export function toBigNumber(ca: CurrencyAmount<Currency> | undefined): BigNumber {
  return ca ? new BigNumber(ca.toExact()) : new BigNumber(0);
}

export function isDPZeroCA(ca: CurrencyAmount<Currency> | undefined, decimalPlaces: number): boolean {
  if (!ca) return true;
  if (decimalPlaces === 0) return isZeroCA(ca);
  return ca.toFixed(decimalPlaces) === `0.${'0'.repeat(decimalPlaces)}`;
}

export enum PageLocation {
  HOME = '/',
  TRADE = '/trade',
  VOTE = '/vote',
}

export function getPoolFromName(name: string): { base: Token; quote: Token } | undefined {
  const token1 = COMBINED_TOKENS_LIST.find(token => token.symbol === name.split('/')[0]);
  const token2 = COMBINED_TOKENS_LIST.find(token => token.symbol === name.split('/')[1]);

  if (token1 && token2) return { base: token1, quote: token2 };
}

export function getAccumulatedInterest(principal: BigNumber, rate: BigNumber, days: number): BigNumber {
  const dailyRate = rate.div(365);
  const accumulatedInterest = principal.times(dailyRate.plus(1).pow(days)).minus(principal);
  return accumulatedInterest;
}
