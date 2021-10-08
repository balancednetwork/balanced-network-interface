import React, { useMemo } from 'react';

import styled from 'styled-components';

import ICONLogo from 'assets/images/icon-logo.png';
import { Currency } from 'types/balanced-sdk-core';

import Logo from '../Logo1';

export const getTokenLogoURL = (address: string): string | void => {
  return `https://raw.githubusercontent.com/balancednetwork/assets/feat/add-icon-assets/blockchains/icon/assets/${address}/logo.png`;
};

const StyledICONLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
  border-radius: 24px;
`;

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  border-radius: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
`;

export default function CurrencyLogo({
  currency,
  size = '24px',
  style,
  ...rest
}: {
  currency?: Currency | null;
  size?: string;
  style?: React.CSSProperties;
}) {
  const srcs: string[] = useMemo(() => {
    if (!currency || currency.isNative) return [];

    if (currency.isToken) {
      const defaultUrls: string[] = [];
      const url = getTokenLogoURL(currency.address);
      if (url) {
        defaultUrls.push(url);
      }
      return defaultUrls;
    }
    return [];
  }, [currency]);

  if (currency?.isNative || currency?.symbol === 'ICX') {
    return <StyledICONLogo src={ICONLogo} alt="icon logo" size={size} style={style} {...rest} />;
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />;
}
