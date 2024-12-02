import { cn } from '@/lib/utils';
import { XChain } from '@balancednetwork/xwagmi/types';
import React from 'react';

export const ChainLogo = ({ chain, className }: { chain: XChain; className?: string }) => {
  return (
    <div className={cn('w-6 h-6 p-0.5 bg-[#d4c5f9] rounded-full justify-center items-center inline-flex', className)}>
      <img width="100%" height="100%" src={`/icons/chains/${chain.xChainId}.svg`} srcSet="" alt={chain.name} />
    </div>
  );
};
