import React from 'react';

import { xChainMap } from '@/xwagmi/constants/xChains';
import { XToken } from '@balancednetwork/sdk-core';

import { cn } from '@/lib/utils';
import { ChainLogo } from '../ChainLogo';
import CurrencyLogo from '../CurrencyLogo';

const CurrencyLogoWithNetwork = ({
  currency,
  size,
  className,
}: {
  currency: XToken;
  size: string;
  className?: string;
}) => {
  return (
    <div
      className="relative"
      style={{
        width: size,
        height: size,
      }}
    >
      <CurrencyLogo currency={currency} size={size} />
      <div
        className={cn(
          'absolute rounded-[3px] w-[50%] h-[50%] bg-background outline-[2px] outline outline-background right-0 bottom-0',
          className,
        )}
      >
        <ChainLogo chain={xChainMap[currency.xChainId]} className="w-full h-full" />
      </div>
    </div>
  );
};

export default CurrencyLogoWithNetwork;
