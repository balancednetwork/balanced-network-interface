import BigNumber from 'bignumber.js';

import { ONE, ZERO } from 'constants/index';

import { RootState } from './RootState';

export type { RootState };

export type CurrencyKey = string;

export declare class Currency {
  readonly decimals: number;
  readonly symbol: string;
  readonly name: string;

  /**
   * Constructs an instance of the base class `Currency`. The only instance of the base class `Currency` is `Currency.ETHER`.
   * @param decimals decimals of the currency
   * @param symbol symbol of the currency
   * @param name of the currency
   */
  protected constructor(decimals: number, symbol?: string, name?: string);
}

export class CurrencyAmount {
  public readonly currencyKey: CurrencyKey;
  public readonly amount: BigNumber;

  public constructor(currency: CurrencyKey, amount: BigNumber) {
    this.currencyKey = currency;
    this.amount = amount;
  }

  get raw(): BigNumber {
    return this.amount;
  }

  public add(other: CurrencyAmount): CurrencyAmount {
    // invariant(currencyEquals(this.currency, other.currency), 'TOKEN');
    return new CurrencyAmount(this.currencyKey, this.amount.plus(other.amount));
  }

  public subtract(other: CurrencyAmount): CurrencyAmount {
    // invariant(currencyEquals(this.currency, other.currency), 'TOKEN');
    return new CurrencyAmount(this.currencyKey, this.amount.minus(other.amount));
  }

  public toSignificant(
    significantDigits: number = 6,
    // format?: object,
    // rounding: Rounding = Rounding.ROUND_DOWN,
  ): string {
    return this.amount.dp(significantDigits).toFixed();
  }

  public toFixed(): string {
    return this.amount.toFixed();
  }
}

export class Price {
  public readonly baseCurrencyKey: CurrencyKey; // input i.e. denominator
  public readonly quoteCurrencyKey: CurrencyKey; // output i.e. numerator
  public readonly value: BigNumber; // output i.e. numerator

  public constructor(baseCurrencyKey: CurrencyKey, quoteCurrencyKey: CurrencyKey, value: BigNumber) {
    this.baseCurrencyKey = baseCurrencyKey;
    this.quoteCurrencyKey = quoteCurrencyKey;
    this.value = value;
  }

  get raw(): BigNumber {
    return this.value;
  }

  public invert(): Price {
    return new Price(this.quoteCurrencyKey, this.baseCurrencyKey, ONE.div(this.value));
  }

  // public toSignificant(significantDigits: number = 6, format?: object, rounding?: Rounding): string {
  //   return this.adjusted.toSignificant(significantDigits, format, rounding);
  // }

  // public toFixed(decimalPlaces: number = 4, format?: object, rounding?: Rounding): string {
  //   return this.adjusted.toFixed(decimalPlaces, format, rounding);
  // }
}

export enum TradeType {
  EXACT_INPUT,
  EXACT_OUTPUT,
}

/**
 * Returns the percent difference between the mid price and the execution price, i.e. price impact.
 * @param midPrice mid price before the trade
 * @param inputAmount the input amount of the trade
 * @param outputAmount the output amount of the trade
 */
function computePriceImpact(midPrice: Price, inputAmount: CurrencyAmount, outputAmount: CurrencyAmount): BigNumber {
  const exactQuote = midPrice.raw.times(inputAmount.raw);
  // calculate slippage := (exactQuote - outputAmount) / exactQuote
  const slippage = exactQuote.minus(outputAmount.raw).div(exactQuote);
  return slippage;
}

export class Trade {
  /**
   * The route of the trade, i.e. which pairs the trade goes through.
   */
  // public readonly route: Route;
  /**
   * The type of the trade, either exact in or exact out.
   */
  // public readonly tradeType: TradeType;
  /**
   * The input amount for the trade assuming no slippage.
   */
  public readonly inputAmount: CurrencyAmount;
  /**
   * The output amount for the trade assuming no slippage.
   */
  public readonly outputAmount: CurrencyAmount;
  /**
   * The price expressed in terms of output amount/input amount.
   */
  public readonly executionPrice: Price;
  /**
   * The mid price after the trade executes assuming no slippage.
   */
  // public readonly nextMidPrice: Price;
  /**
   * The percent difference between the mid price before the trade and the trade execution price.
   */
  public readonly priceImpact: BigNumber;

  /**
   * Constructs an exact in trade with the given amount in and route
   * @param route route of the exact in trade
   * @param amountIn the amount being passed in
   */
  // public static exactIn(route: Route, amountIn: CurrencyAmount): Trade {
  //   return new Trade(route, amountIn, TradeType.EXACT_INPUT);
  // }

  /**
   * Constructs an exact out trade with the given amount out and route
   * @param route route of the exact out trade
   * @param amountOut the amount returned by the trade
   */
  // public static exactOut(route: Route, amountOut: CurrencyAmount): Trade {
  //   return new Trade(route, amountOut, TradeType.EXACT_OUTPUT);
  // }

  public constructor(inputAmount: CurrencyAmount, outputAmount: CurrencyAmount, pool: Pool) {
    this.inputAmount = inputAmount;
    this.outputAmount = outputAmount;
    this.executionPrice = new Price(
      inputAmount.currencyKey,
      outputAmount.currencyKey,
      outputAmount.amount.div(inputAmount.amount),
    );

    if (this.isQueue) {
      this.priceImpact = ZERO;
    } else {
      const base = inputAmount.currencyKey === pool.baseCurrencyKey ? pool.base : pool.quote;
      const quote = outputAmount.currencyKey === pool.quoteCurrencyKey ? pool.quote : pool.base;
      const midPrice = new Price(pool.baseCurrencyKey, pool.quoteCurrencyKey, quote.div(base));
      const realizedLPFee = 0.003;
      this.priceImpact = computePriceImpact(midPrice, this.inputAmount, this.outputAmount).minus(realizedLPFee);
    }
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  public minimumAmountOut(slippageTolerance: number): CurrencyAmount {
    let slippageAdjustedAmountOut: BigNumber;
    if (this.inputAmount.currencyKey === 'sICX' && this.outputAmount.currencyKey === 'ICX') {
      slippageAdjustedAmountOut = this.outputAmount.amount;
    } else if (this.inputAmount.currencyKey === 'ICX' && this.outputAmount.currencyKey === 'sICX') {
      slippageAdjustedAmountOut = this.outputAmount.amount;
    } else {
      slippageAdjustedAmountOut = this.outputAmount.amount.times(10_000).div(10_000 + slippageTolerance);
    }
    return new CurrencyAmount(this.outputAmount.currencyKey, slippageAdjustedAmountOut);
  }

  get fee(): CurrencyAmount {
    let feeAmount: BigNumber;
    if (this.inputAmount.currencyKey === 'sICX' && this.outputAmount.currencyKey === 'ICX') {
      feeAmount = this.inputAmount.amount.times(0.01);
    } else if (this.inputAmount.currencyKey === 'ICX' && this.outputAmount.currencyKey === 'sICX') {
      feeAmount = new BigNumber(0);
    } else {
      feeAmount = this.inputAmount.amount.times(0.003);
    }

    return new CurrencyAmount(this.inputAmount.currencyKey, feeAmount);
  }

  get isQueue(): boolean {
    if (this.inputAmount.currencyKey === 'sICX' && this.outputAmount.currencyKey === 'ICX') {
      return true;
    } else if (this.inputAmount.currencyKey === 'ICX' && this.outputAmount.currencyKey === 'sICX') {
      return true;
    }
    return false;
  }
}

// uniswap sdk error
// see https://stackoverflow.com/a/41102306
const CAN_SET_PROTOTYPE = 'setPrototypeOf' in Object;

/**
 * Indicates that the pair has insufficient reserves for a desired output amount. I.e. the amount of output cannot be
 * obtained by sending any amount of input.
 */
export class InsufficientReservesError extends Error {
  public readonly isInsufficientReservesError: true = true;

  public constructor() {
    super();
    this.name = this.constructor.name;
    if (CAN_SET_PROTOTYPE) Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Indicates that the input amount is too small to produce any amount of output. I.e. the amount of input sent is less
 * than the price of a single unit of output after fees.
 */
export class InsufficientInputAmountError extends Error {
  public readonly isInsufficientInputAmountError: true = true;

  public constructor() {
    super();
    this.name = this.constructor.name;
    if (CAN_SET_PROTOTYPE) Object.setPrototypeOf(this, new.target.prototype);
  }
}

export interface Pool {
  baseCurrencyKey: string;
  quoteCurrencyKey: string;
  base: BigNumber;
  quote: BigNumber;
  baseDeposited: BigNumber;
  quoteDeposited: BigNumber;
  total: BigNumber;
  rewards: BigNumber;
  rate: BigNumber;
  inverseRate: BigNumber;
}

export interface ProposalInterface {
  id: number;
  name: string;
  proposer: string;
  description: string;
  majority: number;
  snapshotDay: number;
  startDay: number;
  endDay: number;
  quorum: number;
  for: number;
  against: number;
  uniqueApproveVoters: number;
  uniqueRejectVoters: number;
  status: string;
  sum: number;
  voters: number;
}
