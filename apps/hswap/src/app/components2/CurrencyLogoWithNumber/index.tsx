import React from 'react';

import { XToken } from '@balancednetwork/sdk-core';

import { cn } from '@/lib/utils';
import CurrencyLogo from '../CurrencyLogo';

const CurrencyLogoWithNumber = ({
  currency,
  className,
  amount,
}: {
  currency: XToken;
  className?: string;
  amount: number;
}) => {
  return (
    <div className={cn('relative bg-[#d4c5f9] p-1 w-10 h-10 rounded-full', className)}>
      <CurrencyLogo currency={currency} className="w-full h-full p-0" />
      <div className={cn('absolute w-[50%] h-[50%] rounded-full border-[#E6E0F7] right-0 bottom-0 border-[2px]')}>
        <div className="bg-title-gradient rounded-full w-full h-full flex justify-center items-center text-white text-[10px] font-bold leading-3">
          {amount}
        </div>
      </div>
    </div>
  );
};

export default CurrencyLogoWithNumber;
