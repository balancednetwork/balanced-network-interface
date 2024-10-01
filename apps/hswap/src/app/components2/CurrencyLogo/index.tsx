import React, { useMemo } from 'react';

import { Currency } from '@balancednetwork/sdk-core';

import ICONLogo from '@/assets/images/icon-logo.png';
import { WrappedTokenInfo } from '@/store/lists/wrappedTokenInfo';

import { cn } from '@/lib/utils';
import FallbackImage from '../FallbackImage';

export const getTokenLogoURL = (address: string): string => {
  return `https://raw.githubusercontent.com/balancednetwork/assets/master/blockchains/icon/assets/${address}/logo.png`;
};

export const getTokenLogoURLFromSymbol = (symbol: string): string => {
  return `https://raw.githubusercontent.com/balancednetwork/icons/master/tokens/${symbol.toLocaleLowerCase()}.png`;
};

export default function CurrencyLogo({
  currency,
  size = '24px',
  className,
  ...rest
}: {
  currency?: Currency | null;
  size?: string;
  className?: string;
}) {
  const uriLocation = currency instanceof WrappedTokenInfo ? currency.logoURI || currency.tokenInfo.logoURI : undefined;

  const boxShadowClass = 'shadow-[0px_6px_10px_rgba(0,0,0,0.075)]';
  const sizeClass = `w-[${size}] h-[${size}]`;

  const srcs: string[] = useMemo(() => {
    if (!currency || currency.isNative) return [];

    if (currency?.isToken) {
      const defaultUrls = [getTokenLogoURL(currency.address), getTokenLogoURLFromSymbol(currency?.symbol!)];

      if (currency instanceof WrappedTokenInfo) {
        return uriLocation ? [uriLocation, ...defaultUrls] : [...defaultUrls];
      }
      return defaultUrls;
    }

    return [];
  }, [uriLocation, currency]);

  if (currency?.isNative || currency?.symbol === 'ICX') {
    return <img src={ICONLogo} alt="icon logo" className={cn(sizeClass, boxShadowClass, className)} {...rest} />;
  }

  return (
    <FallbackImage
      srcs={srcs}
      alt={`${currency?.symbol ?? 'token'} logo`}
      className={cn(sizeClass, boxShadowClass, className)}
      {...rest}
    />
  );
}
