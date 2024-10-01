import { useRatesWithOracle } from '@/queries/reward';
import { toFraction } from '@/utils';
import { formatPrice } from '@/utils/formatter';
import { Currency, CurrencyAmount, XToken } from '@balancednetwork/sdk-core';
import { useMemo } from 'react';

export default function (currencyAmount: CurrencyAmount<XToken | Currency> | undefined): string {
  const prices = useRatesWithOracle();

  const valueInUSD = useMemo(() => {
    try {
      if (currencyAmount && prices?.[currencyAmount.currency.symbol]) {
        const _price = toFraction(prices[currencyAmount.currency.symbol]);
        return formatPrice(currencyAmount?.multiply(_price).toFixed());
      }
    } catch (e) {
      // TODO: handle error
      // console.log(e);
    }
    return '';
  }, [currencyAmount, prices]);
  return valueInUSD;
}
