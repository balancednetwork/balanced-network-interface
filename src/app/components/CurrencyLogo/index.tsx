import React from 'react';

import { Typography } from 'app/theme';
import { Currency } from 'types/balanced-sdk-core';
import { getCurrencyIcon } from 'utils';

export default function CurrencyLogo({
  currency,
  size = 24,
  style,
  ...rest
}: {
  currency: Currency;
  size?: number;
  style?: React.CSSProperties;
}) {
  const Icon = getCurrencyIcon(currency);

  if (Icon) return <Icon width={`${size}px`} height={`${size}px`} style={style} {...rest} />;
  else return <Typography>{currency?.symbol!.charAt(0)}</Typography>;
}
