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

    if (token) return CurrencyAmount.fromRawAmount(token, value.amount.toString());
  }
};

export const convertPair = (pairInfo: PairInfo, pool?: Pool) => {
  if (pool) {
    const baseToken = getTokenFromCurrencyKey(pool.baseCurrencyKey);
    const quoteToken = getTokenFromCurrencyKey(pool.quoteCurrencyKey);

    if (baseToken && quoteToken)
      return new Pair(
        CurrencyAmount.fromRawAmount(baseToken, pool.baseDeposited.toString()),
        CurrencyAmount.fromRawAmount(quoteToken, pool.quoteDeposited.toString()),
      );
  }
};
