'use client';

import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { XChain } from '@/xwagmi/types';
import { ChainLogo } from '@/app/components2/ChainLogo';
import * as SelectPrimitive from '@radix-ui/react-select';
import { ChevronDown } from 'react-feather';
import { ChevronUp } from 'lucide-react';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChainId } from '@balancednetwork/sdk-core';

interface XChainSelectProps {
  xChains: XChain[];
  onValueChange?: (value: XChainId) => void;
  value?: XChainId | 'all';
  defaultValue?: XChainId | 'all';
  className?: string;
}

const AllChainLogo = () => {
  return <img width="28px" height="28px" src="/icons/chains/all.png" srcSet="" alt={'All'} className="" />;
};

export default function XChainSelect({
  xChains = [],
  onValueChange,
  value,
  defaultValue = 'all',
  className,
}: XChainSelectProps) {
  const [open, setOpen] = useState(false);
  const [_value, setValue] = useState<string>(defaultValue);

  useEffect(() => {
    if (value) setValue(value);
  }, [value]);

  const handleValueChange = (value: string) => {
    setValue(value);
    onValueChange && onValueChange(value as XChainId);
  };
  return (
    <div className={className}>
      <Select open={open} onOpenChange={setOpen} value={_value} onValueChange={handleValueChange}>
        <SelectPrimitive.Trigger asChild>
          <div className="cursor-pointer flex gap-2 items-center">
            {_value === 'all' ? <AllChainLogo /> : <ChainLogo chain={xChainMap[_value]} size="28px" />}
            {open ? (
              <ChevronUp className="h-4 w-4 opacity-50 text-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 opacity-50 text-foreground" />
            )}
          </div>
        </SelectPrimitive.Trigger>

        <SelectContent className="bg-background text-foreground p-2 gap-2 flex flex-col w-[200px]">
          <SelectItem value={'all'} className="pl-2 focus:bg-[#221542] focus:text-foreground">
            <div className="flex gap-2 items-center py-1">
              <AllChainLogo />
              <span className="text-base font-[600]">All</span>
            </div>
          </SelectItem>
          {xChains.map(xChain => (
            <SelectItem
              key={xChain.xChainId}
              value={xChain.xChainId}
              className="pl-2 focus:bg-[#221542] focus:text-foreground"
            >
              <div className="flex gap-2 items-center py-1">
                <ChainLogo chain={xChain} size="28px" />
                <span className="text-base font-[600]">{xChain.name}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
