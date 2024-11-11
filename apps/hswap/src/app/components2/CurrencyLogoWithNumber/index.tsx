import React from 'react';

import { XToken } from '@balancednetwork/sdk-core';

import { cn } from '@/lib/utils';
import CurrencyLogo from '../CurrencyLogo';

const CurrencyLogoWithNumber = ({
  currency,
  size,
  className,
  amount,
}: {
  currency: XToken;
  size: string;
  className?: string;
  amount: number;
}) => {
  return (
    <div className={cn('relative bg-[#d4c5f9] rounded-full p-1')}>
      <CurrencyLogo currency={currency} size={size} />
      <div
        className={cn(
          'absolute w-[50%] h-[50%] rounded-full border-[#E6E0F7] right-0 bottom-0 border-[2px]',
          className,
        )}
      >
        <div className="bg-title-gradient rounded-full w-full h-full flex justify-center items-center text-white text-[10px] font-bold leading-3">
          {amount}
        </div>
      </div>
    </div>
  );
};

export default CurrencyLogoWithNumber;
