import React, { useEffect, useMemo } from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import { useAllTokensByAddress } from '@/queries/backendv2';
import styled from 'styled-components';

import ICONLogo from '@/assets/images/icon-logo.png';

import Logo from '../Logo1';

export const getTokenLogoURL = (address: string): string | void => {
  return `https://raw.githubusercontent.com/balancednetwork/assets/master/blockchains/icon/assets/${address}/logo.png`;
};

const StyledICONLogo = styled.img<{ size: string }>`
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

export function CurrencyLogoFromURI({
  address,
  size = '24px',
  style,
  ...rest
}: {
  address?: string;
  size?: string;
  style?: React.CSSProperties;
}) {
  const { data: allTokens } = useAllTokensByAddress();
  const [rawGithubLogo, setRawGithubLogo] = React.useState<string | null>(null);

  useEffect(() => {
    if (allTokens && address && allTokens[address] && allTokens[address].logo_uri) return;
    const token = address && allTokens && allTokens[address];

    async function fetchLogo() {
      if (token) {
        try {
          const response = await fetch(
            `https://raw.githubusercontent.com/balancednetwork/icons/master/tokens/${token.symbol.toLowerCase()}.png`,
            { method: 'HEAD' },
          );
          if (response.ok) {
            setRawGithubLogo(response.url);
          }
        } catch (error) {
          console.error(`Error checking ${token.symbol} logo:`, error);
          return false;
        }
      }
    }

    fetchLogo();
  }, [address, allTokens]);

  if (address === 'ICX') {
    return <StyledICONLogo src={ICONLogo} alt="icon logo" size={size} style={style} {...rest} />;
  }

  if (allTokens && address && allTokens[address] && allTokens[address].logo_uri) {
    return <StyledLogo size={size} srcs={[allTokens[address].logo_uri]} style={style} {...rest} />;
  }

  if (rawGithubLogo) {
    return <StyledLogo size={size} srcs={[rawGithubLogo]} style={style} {...rest} />;
  }
  return <StyledLogo size={size} srcs={[]} style={style} {...rest} />;
}
