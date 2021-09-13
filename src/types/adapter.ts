import BigNumber from 'bignumber.js';

import { NETWORK_ID } from '../constants/config';
import { PairInfo } from '../constants/pairs';
import { SUPPORTED_TOKENS } from '../constants/tokens';
import { Token, Price, Currency } from './balanced-sdk-core/entities';
import { CurrencyAmount } from './balanced-sdk-core/entities/fractions';
import { Pair } from './balanced-v1-sdk/entities';
import { CurrencyAmount as LegacyCurrencyAmount, CurrencyKey, Pool, Price as LegacyPrice } from './index';

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
      BigNumber.isBigNumber(pool.base) &&
      !pool.base.isNaN() &&
      BigNumber.isBigNumber(pool.quote) &&
      !pool.quote.isNaN()
    ) {
      const [baseNumerator, baseDenominator] = pool.base
        .times(new BigNumber(10).exponentiatedBy(baseToken.decimals))
        .toFraction();
      const [quoteNumerator, quoteDenominator] = pool.quote
        .times(new BigNumber(10).exponentiatedBy(quoteToken.decimals))
        .toFraction();
      return new Pair(
        CurrencyAmount.fromFractionalAmount(baseToken, baseNumerator.toFixed(), baseDenominator.toFixed()),
        CurrencyAmount.fromFractionalAmount(quoteToken, quoteNumerator.toFixed(), quoteDenominator.toFixed()),
      );
    }
  }
};

export const revertPrice = (price: Price<Currency, Currency>): LegacyPrice => {
  return new LegacyPrice(
    price.baseCurrency.symbol || 'IN',
    price.quoteCurrency.symbol || 'OUT',
    new BigNumber(price.toFixed()),
  );
};
