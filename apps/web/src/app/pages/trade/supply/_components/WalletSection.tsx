import React from 'react';

import { Currency, CurrencyAmount, Fraction } from '@balancednetwork/sdk-core';
import { t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Flex } from 'rebass/styled-components';

import { Typography } from '@/app/theme';
import { BIGINT_ZERO } from '@/constants/misc';
import { useDerivedMintInfo } from '@/store/mint/hooks';
import { Field } from '@/store/mint/reducer';
import { formatBigNumber } from '@/utils';
import { formatSymbol } from '@/utils/formatter';

function subtract(
  amountA: CurrencyAmount<Currency> | undefined,
  amountB: CurrencyAmount<Currency> | undefined,
): CurrencyAmount<Currency> | undefined {
  if (!amountA) return undefined;
  if (!amountB) return amountA;

  let diff;
  if (amountA.decimalScale !== amountB.decimalScale) {
    // TODO: use the defined function in utils
    const amountBConverted = CurrencyAmount.fromRawAmount(
      amountA.currency,
      new BigNumber(amountB.toFixed()).times((10n ** BigInt(amountA.currency.decimals)).toString()).toFixed(0),
    );
    diff = new Fraction(amountA.numerator).subtract(amountBConverted);
  } else {
    diff = new Fraction(`${amountA.quotient}`).subtract(new Fraction(`${amountB.quotient}`));
  }
  return CurrencyAmount.fromRawAmount(amountA.currency, diff.quotient);
}

function WalletSection() {
  const { currencies, currencyBalances, parsedAmounts } = useDerivedMintInfo();

  const remains: { [field in Field]?: CurrencyAmount<Currency> } = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: subtract(currencyBalances[Field.CURRENCY_A], parsedAmounts[Field.CURRENCY_A]),
      [Field.CURRENCY_B]: subtract(currencyBalances[Field.CURRENCY_B], parsedAmounts[Field.CURRENCY_B]),
    }),
    [currencyBalances, parsedAmounts],
  );

  const formattedRemains: { [field in Field]?: string } = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: remains[Field.CURRENCY_A]?.lessThan(BIGINT_ZERO)
        ? '0'
        : formatBigNumber(new BigNumber(remains[Field.CURRENCY_A]?.toFixed() || 0), 'currency'),
      [Field.CURRENCY_B]: remains[Field.CURRENCY_B]?.lessThan(BIGINT_ZERO)
        ? '0'
        : formatBigNumber(new BigNumber(remains[Field.CURRENCY_B]?.toFixed() || 0), 'currency'),
    }),
    [remains],
  );

  return (
    <Flex flexDirection="row" justifyContent="center" alignItems="center">
      <Typography sx={{ whiteSpace: 'nowrap' }}>
        {t`Wallet: ${formattedRemains[Field.CURRENCY_A]} ${formatSymbol(currencies[Field.CURRENCY_A]?.symbol)} /
                      ${formattedRemains[Field.CURRENCY_B]} ${formatSymbol(currencies[Field.CURRENCY_B]?.symbol)}`}
      </Typography>
    </Flex>
  );
}

export default WalletSection;
