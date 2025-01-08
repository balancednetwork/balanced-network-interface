import React, { useMemo } from 'react';

import { Currency } from '@balancednetwork/sdk-core';

import ICONLogo from '@/assets/images/icon-logo.png';
import { WrappedTokenInfo } from '@/store/lists/wrappedTokenInfo';

import { cn } from '@/lib/utils';
import FallbackImage from '../FallbackImage';

const getTokenLogoURL = (address: string): string => {
  return `https://raw.githubusercontent.com/balancednetwork/assets/master/blockchains/icon/assets/${address}/logo.png`;
};

const getTokenLogoURLFromSymbol = (symbol: string): string => {
  return `https://raw.githubusercontent.com/balancednetwork/icons/master/tokens/${symbol.toLocaleLowerCase()}.png`;
};

export default function CurrencyLogo({
  currency,
  className,
  ...rest
}: {
  currency?: Currency | null;
  className?: string;
}) {
  const uriLocation = currency instanceof WrappedTokenInfo ? currency.logoURI || currency.tokenInfo.logoURI : undefined;

  // const boxShadowClass = 'shadow-[0px_6px_10px_rgba(0,0,0,0.075)]';

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
    return (
      <div className={cn('rounded-full w-10 h-10 bg-[#d4c5f9] p-1 justify-center items-center inline-flex', className)}>
        <img src={ICONLogo} alt="icon logo" />
      </div>
    );
  }

  return (
    <div className={cn('rounded-full w-10 h-10 bg-[#d4c5f9] p-1 justify-center items-center inline-flex', className)}>
      <FallbackImage srcs={srcs} alt={`${currency?.symbol ?? 'token'} logo`} />
    </div>
  );
}
