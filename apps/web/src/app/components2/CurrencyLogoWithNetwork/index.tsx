import React from 'react';

import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChainId } from '@balancednetwork/sdk-core';
import { Currency } from '@balancednetwork/sdk-core';

import { cn } from '@/lib/utils';
import { ChainLogo } from '../ChainLogo';
import CurrencyLogo from '../CurrencyLogo';

const CurrencyLogoWithNetwork = ({
  currency,
  chainId,
  size,
  className,
}: {
  currency: Currency;
  chainId: XChainId;
  size: string;
  className?: string;
}) => {
  const right = size === '20px' ? '-5px' : '-4px';
  const bottom = size === '20px' ? '-6px' : '-5px';

  return (
    <div className="relative w-[24px]">
      <CurrencyLogo currency={currency} size={size} />
      <div
        className={cn(
          'absolute rounded-full w-[14px] h-[14px] bg-background outline-[2px] outline outline-background',
          className,
        )}
        style={{
          right: right,
          bottom: bottom,
        }}
      >
        <ChainLogo chain={xChainMap[chainId]} size="14px" className="absolute top-0 left-0" />
      </div>
    </div>
  );
};

export default CurrencyLogoWithNetwork;
