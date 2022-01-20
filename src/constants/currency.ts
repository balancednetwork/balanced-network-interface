import { CurrencyKey, Pool } from 'types';
import { Currency } from 'types/balanced-sdk-core';

import { PairInfo, SUPPORTED_PAIRS } from './pairs';

export const getTradePair = (
  baseKey?: CurrencyKey,
  quoteKey?: CurrencyKey,
): [PairInfo | undefined, boolean | undefined] => {
  if (baseKey && quoteKey) {
    const pair1 = SUPPORTED_PAIRS.find(pair => pair.baseCurrencyKey === baseKey && pair.quoteCurrencyKey === quoteKey);
    const pair2 = SUPPORTED_PAIRS.find(pair => pair.baseCurrencyKey === quoteKey && pair.quoteCurrencyKey === baseKey);

    if (pair1) {
      return [pair1, false];
    } else if (pair2) {
      return [pair2, true];
    }
  }
  return [undefined, undefined];
};

export const isQueue = (t: Pool | PairInfo) => {
  if (
    (t.baseCurrencyKey === 'sICX' && t.quoteCurrencyKey === 'ICX') ||
    (t.baseCurrencyKey === 'ICX' && t.quoteCurrencyKey === 'sICX')
  )
    return true;
  return false;
};

export const canBeQueue = (inputCurrency?: Currency, outputCurrency?: Currency) => {
  if (
    (inputCurrency?.symbol === 'sICX' && outputCurrency?.symbol === 'ICX') ||
    (inputCurrency?.symbol === 'ICX' && outputCurrency?.symbol === 'sICX')
  )
    return true;
  return false;
};
