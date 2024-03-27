import React, { useMemo } from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import styled from 'styled-components';

import ICONLogo from 'assets/images/icon-logo.png';
import { WrappedTokenInfo } from 'store/lists/wrappedTokenInfo';

import Logo from '../Logo1';

export const getTokenLogoURL = (address: string): string => {
  return `https://raw.githubusercontent.com/balancednetwork/assets/master/blockchains/icon/assets/${address}/logo.png`;
};

export const getTokenLogoURLFromSymbol = (symbol: string): string => {
  return `https://raw.githubusercontent.com/balancednetwork/icons/master/tokens/${symbol.toLocaleLowerCase()}.png`;
};

export const StyledICONLogo = styled.img<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.075);
`;

const StyledLogo = styled(Logo)<{ size: string }>`
  width: ${({ size }) => size};
  height: ${({ size }) => size};
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
  const uriLocation = currency instanceof WrappedTokenInfo ? currency.logoURI || currency.tokenInfo.logoURI : undefined;

  const srcs: string[] = useMemo(() => {
    if (!currency || currency.isNative) return [];

    if (currency?.isToken) {
      const defaultUrls = [getTokenLogoURL(currency.address)];

      if (currency?.symbol === 'ARCH') {
        return [getTokenLogoURLFromSymbol('arch')];
      }

      if (currency instanceof WrappedTokenInfo) {
        return uriLocation ? [uriLocation, ...defaultUrls] : [...defaultUrls];
      }
      return defaultUrls;
    }

    return [];
  }, [uriLocation, currency]);

  if (currency?.isNative || currency?.symbol === 'ICX') {
    return <StyledICONLogo src={ICONLogo} alt="icon logo" size={size} style={style} {...rest} />;
  }

  return <StyledLogo size={size} srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} style={style} {...rest} />;
}
