import { Currency } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';

export const shouldHideBecauseOfLowValue = (
  basedOnWallet: boolean,
  price: BigNumber | undefined,
  balance: BigNumber | undefined,
): boolean => {
  if (!price || !balance) {
    return false;
  }

  if (price.isNaN()) {
    return balance.isLessThan(0.01);
  }

  return basedOnWallet && balance.times(price).isLessThan(0.0001);
};

export function currencyKey(currency: Currency): string {
  return currency.isToken ? currency.address : 'ICX';
}
