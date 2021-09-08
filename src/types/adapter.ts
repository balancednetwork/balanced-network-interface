import BigNumber from 'bignumber.js';

import { NETWORK_ID } from '../constants/config';
import { PairInfo } from '../constants/pairs';
import { SUPPORTED_TOKENS } from '../constants/tokens';
import { Token } from './balanced-sdk-core/entities';
import { CurrencyAmount } from './balanced-sdk-core/entities/fractions';
import { Pair } from './balanced-v1-sdk/entities';
import { CurrencyAmount as LegacyCurrencyAmount, CurrencyKey, Pool } from './index';

const tokens = SUPPORTED_TOKENS[NETWORK_ID];

export const getTokenFromCurrencyKey = (key?: CurrencyKey) => {
  if (key) return tokens.find((token: Token) => token.symbol === key);
};

export const convertCurrencyAmount = (value?: LegacyCurrencyAmount) => {
  if (value) {
    const token = getTokenFromCurrencyKey(value.currencyKey);

    if (token) {
      const [numerator, denominator] = value.amount.toFraction();

      return CurrencyAmount.fromFractionalAmount(token, numerator.toFixed(), denominator.toFixed());
    }
  }
};

export const convertPair = (pairInfo: PairInfo, pool?: Pool) => {
  if (pool) {
    const baseToken = getTokenFromCurrencyKey(pool.baseCurrencyKey);
    const quoteToken = getTokenFromCurrencyKey(pool.quoteCurrencyKey);

    if (
      baseToken &&
      quoteToken &&
      BigNumber.isBigNumber(pool.baseDeposited) &&
      !pool.baseDeposited.isNaN() &&
      BigNumber.isBigNumber(pool.quoteDeposited) &&
      pool.quoteDeposited.isNaN()
    ) {
      const [baseNumerator, baseDenominator] = pool.baseDeposited.toFraction();
      const [quoteNumerator, quoteDenominator] = pool.quoteDeposited.toFraction();
      return new Pair(
        CurrencyAmount.fromFractionalAmount(baseToken, baseNumerator.toFixed(), baseDenominator.toFixed()),
        CurrencyAmount.fromFractionalAmount(quoteToken, quoteNumerator.toFixed(), quoteDenominator.toFixed()),
      );
    }
  }
};
