import React from 'react';

import { CurrencyKey } from 'constants/currency';
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

  return <Icon width={`${size}px`} height={`${size}px`} style={style} {...rest} />;
}
