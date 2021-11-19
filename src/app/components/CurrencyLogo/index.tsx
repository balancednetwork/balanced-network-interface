import React from 'react';

import { Typography } from 'app/theme';
import { CurrencyKey } from 'types';
import { getCurrencyKeyIcon } from 'utils';

export default function CurrencyLogo({
  currencyKey,
  size = 24,
  style,
  ...rest
}: {
  currencyKey: CurrencyKey;
  size?: number;
  style?: React.CSSProperties;
}) {
  const Icon = getCurrencyKeyIcon(currencyKey);

  if (Icon) return <Icon width={`${size}px`} height={`${size}px`} style={style} {...rest} />;
  else return <Typography>{currencyKey.charAt(0)}</Typography>;
}
