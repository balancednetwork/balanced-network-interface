import React from 'react';

import { xChainMap } from '@balancednetwork/xwagmi/constants/xChains';

import { cn } from '@/lib/utils';
import { XToken } from '@balancednetwork/xwagmi/types';
import { ChainLogo } from '../ChainLogo';
import CurrencyLogo from '../CurrencyLogo';

const CurrencyLogoWithNetwork = ({
  currency,
  className,
  chainLogoClassName,
}: {
  currency: XToken;
  className?: string;
  chainLogoClassName?: string;
}) => {
  return (
    <div
      className={cn(
        'relative bg-[#d4c5f9] rounded-full p-1 w-10 h-10 inline-flex justify-center items-center',
        className,
      )}
    >
      <CurrencyLogo currency={currency} className="w-full h-full p-0" />
      <div
        className={cn(
          'absolute w-[50%] h-[50%] rounded-full bg-[#E6E0F7] p-[2px] right-0 bottom-0 inline-flex justify-center items-center',
          chainLogoClassName,
        )}
      >
        <ChainLogo chain={xChainMap[currency.xChainId]} className="w-full h-full p-0" />
      </div>
    </div>
  );
};

export default CurrencyLogoWithNetwork;
