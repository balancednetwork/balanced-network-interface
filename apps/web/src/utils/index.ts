import { BalancedJs, CHAIN_INFO, LOOP, SupportedChainId as NetworkId } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { Pair, PairType } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';

import { ONE } from '@/constants';
import { NETWORK_ID } from '@/constants/config';
import { BIGINT_ZERO } from '@/constants/misc';
import { COMBINED_TOKENS_LIST, sICX, wICX } from '@/constants/tokens';
import { PairData, PairState } from '@/hooks/useV2Pairs';
import { Field } from '@/store/swap/reducer';
import { PairInfo } from '@/types';
import { XToken, XTransactionInput, XTransactionType, xChainMap } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import { Validator } from 'icon-sdk-js';
import { formatSymbol } from './formatter';

const { isScoreAddress } = Validator;

// shorten the checksummed version of the input address to have 0x + 4 characters at start and end
export function shortenAddress(address: string, chars = 7): string {
  // !TODO: fix it later
  // if (!isEoaAddress(address) && !isArchEoaAddress(address)) {
  //   throw Error(`Invalid 'address' parameter '${address}'.`);
  // }
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
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

export function maxAmountSpend<T extends Token>(currencyAmount?: CurrencyAmount<T>): CurrencyAmount<T> | undefined {
  if (!currencyAmount) return undefined;
  const xChainId: XChainId = currencyAmount.currency instanceof XToken ? currencyAmount.currency.xChainId : '0x1.icon';

  const minCurrencyGas = currencyAmount.currency.isNativeToken
    ? CurrencyAmount.fromRawAmount(
        currencyAmount.currency,
        new BigNumber(xChainMap[xChainId].gasThreshold)
          .times(2)
          .times(10 ** currencyAmount.currency.decimals)
          .toString(),
      )
    : CurrencyAmount.fromRawAmount(currencyAmount.currency, 0n);

  return currencyAmount.subtract(minCurrencyGas).greaterThan(0)
    ? currencyAmount.subtract(minCurrencyGas)
    : CurrencyAmount.fromRawAmount(currencyAmount.currency, 0n);
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
 * @returns ICX->sICX staking pair
 * @param {tokenA} ICX
 * @param {tokenB} sICX
 *  */
export function getStakingPair(stats) {
  const rate = new BigNumber(stats['price'], 16).div(LOOP);

  const icxSupply = new BigNumber(10 ** 18);
  const sicxSupply = icxSupply.div(rate);

  const totalSupply = icxSupply.toFixed();
  return new Pair(
    CurrencyAmount.fromRawAmount(wICX[NetworkId.MAINNET], totalSupply),
    CurrencyAmount.fromRawAmount(sICX[NetworkId.MAINNET], sicxSupply.toFixed(0)),
    {
      type: PairType.STAKING,
    },
  );
}

export function getPair(stats, tokenA: Token, tokenB: Token): PairData {
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
    ca.numerator * bnFrac.numerator,
    ca.denominator * bnFrac.denominator,
  );
}

export function isZeroCA(ca: CurrencyAmount<Currency>): boolean {
  return ca.quotient === BIGINT_ZERO;
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

export function getTransactionAttributes(xTransactionInput: XTransactionInput) {
  let descriptionAction: string, descriptionAmount: string;
  switch (xTransactionInput.type) {
    case XTransactionType.BRIDGE: {
      const _tokenSymbol = formatSymbol(xTransactionInput.inputAmount.currency.symbol);
      const _formattedAmount = formatBigNumber(
        new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0),
        'currency',
      );
      descriptionAction = `Transfer ${_tokenSymbol}`;
      descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
      break;
    }
    case XTransactionType.SWAP: {
      const { inputAmount, outputAmount } = xTransactionInput;
      const _inputTokenSymbol = formatSymbol(inputAmount.currency.symbol) || '';
      const _outputTokenSymbol = formatSymbol(outputAmount?.currency.symbol) || '';
      const _inputAmount = formatBigNumber(new BigNumber(inputAmount.toFixed() || 0), 'currency');
      const _outputAmount = formatBigNumber(new BigNumber(outputAmount?.toFixed() || 0), 'currency');
      descriptionAction = `Swap ${_inputTokenSymbol} for ${_outputTokenSymbol}`;
      descriptionAmount = `${_inputAmount} ${_inputTokenSymbol} for ${_outputAmount} ${_outputTokenSymbol}`;
      break;
    }
    case XTransactionType.DEPOSIT: {
      const _tokenSymbol = formatSymbol(xTransactionInput.inputAmount.currency.symbol);
      const _formattedAmount = formatBigNumber(
        new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0),
        'currency',
      );
      descriptionAction = `Deposit ${_tokenSymbol} as collateral`;
      descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
      break;
    }
    case XTransactionType.WITHDRAW: {
      const _tokenSymbol = formatSymbol(xTransactionInput.inputAmount.currency.symbol);
      const _formattedAmount = formatBigNumber(
        new BigNumber(xTransactionInput?.inputAmount.multiply(-1).toFixed() || 0),
        'currency',
      );
      descriptionAction = `Withdraw ${_tokenSymbol} collateral`;
      descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
      break;
    }
    case XTransactionType.BORROW: {
      const _formattedAmount = formatBigNumber(
        new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0),
        'currency',
      );
      descriptionAction = `Borrow bnUSD`;
      descriptionAmount = `${_formattedAmount} bnUSD`;
      break;
    }
    case XTransactionType.REPAY: {
      const _formattedAmount = formatBigNumber(
        new BigNumber(xTransactionInput?.inputAmount.multiply(-1).toFixed() || 0),
        'currency',
      );
      descriptionAction = `Repay bnUSD`;
      descriptionAmount = `${_formattedAmount} bnUSD`;
      break;
    }

    case XTransactionType.LP_DEPOSIT_XTOKEN: {
      const _tokenSymbol = formatSymbol(xTransactionInput.inputAmount.currency.symbol);
      const _formattedAmount = formatBigNumber(
        new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0),
        'currency',
      );
      descriptionAction = `Supply ${_tokenSymbol}`;
      descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
      break;
    }

    case XTransactionType.LP_WITHDRAW_XTOKEN: {
      const _tokenSymbol = formatSymbol(xTransactionInput.inputAmount.currency.symbol);
      const _formattedAmount = formatBigNumber(
        new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0),
        'currency',
      );
      descriptionAction = `Withdraw ${_tokenSymbol}`;
      descriptionAmount = `${_formattedAmount} ${_tokenSymbol}`;
      break;
    }

    case XTransactionType.LP_ADD_LIQUIDITY: {
      const _tokenSymbol1 = formatSymbol(xTransactionInput.inputAmount.currency.symbol);
      const _tokenSymbol2 = formatSymbol(xTransactionInput.outputAmount?.currency.symbol);

      const _formattedInputAmount = formatBigNumber(
        new BigNumber(xTransactionInput?.inputAmount.toFixed() || 0),
        'currency',
      );
      const _formattedOutputAmount = formatBigNumber(
        new BigNumber(xTransactionInput?.outputAmount!.toFixed() || 0),
        'currency',
      );

      descriptionAction = `Supply ${_tokenSymbol1} / ${_tokenSymbol2} liquidity`;
      descriptionAmount = `${_formattedInputAmount} ${_tokenSymbol1} and ${_formattedOutputAmount} ${_tokenSymbol2}`;
      break;
    }

    // TODO:
    // case XTransactionType.LP_CLAIM_REWARDS: {
    //   break;
    // }

    case XTransactionType.LP_REMOVE_LIQUIDITY: {
      const { withdrawAmountA, withdrawAmountB, tokenASymbol, tokenBSymbol } = xTransactionInput;

      const _formmatedAmountA = formatBigNumber(new BigNumber(withdrawAmountA?.toFixed() || 0), 'currency');
      const _formmatedAmountB = formatBigNumber(new BigNumber(withdrawAmountB?.toFixed() || 0), 'currency');

      descriptionAction = `Withdraw ${formatSymbol(tokenASymbol)} / ${tokenBSymbol} liquidity`;
      descriptionAmount = `${_formmatedAmountA} ${formatSymbol(tokenASymbol)} and ${_formmatedAmountB} ${tokenBSymbol}`;
      break;
    }

    case XTransactionType.LP_STAKE: {
      const { tokenASymbol, tokenBSymbol } = xTransactionInput;
      descriptionAction = `Stake ${formatSymbol(tokenASymbol)} / ${tokenBSymbol} LP tokens`;
      descriptionAmount = ``;
      break;
    }
    case XTransactionType.LP_UNSTAKE: {
      const { tokenASymbol, tokenBSymbol } = xTransactionInput;
      descriptionAction = `Unstake ${formatSymbol(tokenASymbol)} / ${tokenBSymbol} LP tokens`;
      descriptionAmount = ``;

      break;
    }

    default: {
      descriptionAction = 'Unknown';
      descriptionAmount = 'Unknown';
      break;
    }
  }

  return { descriptionAction, descriptionAmount };
}
