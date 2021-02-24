import React from 'react';

import styled from 'styled-components';

import BALNLogo from 'assets/logos/baln.png';
import ICDLogo from 'assets/logos/icd.svg';
import ICXLogo from 'assets/logos/icx.svg';
import SICXLogo from 'assets/logos/sicx.svg';
import { Currency } from 'types';

const LOGOS = {
  ICX: ICXLogo,
  BALN: BALNLogo,
  bnUSD: ICDLogo,
  sICX: SICXLogo,
};

const getTokenLogoURL = (symbol?: string) => {
  return symbol && LOGOS[symbol];
};

const StyledLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  /* border-radius: ${({ size }) => size}; */
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
`;

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
}: {
  currency?: Currency | null;
  size?: string;
  style?: React.CSSProperties;
}) {
  return <StyledLogo alt={currency?.symbol} size={size} style={style} src={getTokenLogoURL(currency?.symbol)} />;
}
