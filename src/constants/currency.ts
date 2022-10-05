import { Currency } from '@balancednetwork/sdk-core';

import { Pool } from 'types';

import { PairInfo } from './pairs';

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
