'use client';

import React, { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem } from '@/components/ui/select';
import { XChain, XChainId } from '@/xwagmi/types';
import { ChainLogo } from '@/app/components2/ChainLogo';
import * as SelectPrimitive from '@radix-ui/react-select';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { AllChainIcon, ChevronDownIcon } from '../Icons';

interface XChainSelectProps {
  xChains: XChain[];
  onValueChange?: (value: XChainId) => void;
  value?: XChainId | 'all';
  defaultValue?: XChainId | 'all';
  className?: string;
}

const AllChainLogo = ({ className }: { className?: string }) => {
  return (
    <div className={cn('w-8 h-8 bg-[#d4c5f9] rounded-full flex justify-center items-center', className)}>
      <AllChainIcon />
    </div>
  );
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
          <div className="cursor-pointer flex flex-col gap-2 justify-center items-center">
            <div className="relative">
              {_value === 'all' ? (
                <AllChainLogo className="w-10 h-10 p-1" />
              ) : (
                <ChainLogo chain={xChainMap[_value]} className="w-10 h-10 p-1" />
              )}
              <div
                className={cn(
                  'absolute w-[50%] h-[50%] rounded-full border-[#E6E0F7] right-0 bottom-0 border-[2px]',
                  className,
                )}
              >
                <div className="bg-title-gradient rounded-full w-full h-full flex justify-center items-center">
                  <ChevronDownIcon className="fill-white" />
                </div>
              </div>
            </div>
            <div className="self-stretch text-center text-[#d4c5f9] text-[10px] font-semibold uppercase leading-3">
              {_value === 'all' ? 'All chains' : xChainMap[_value].name}{' '}
            </div>
          </div>
        </SelectPrimitive.Trigger>

        <SelectContent
          className="bg-[#D4C5F9] rounded-3xl backdrop-blur-[50px] text-[#0d0229] p-0 py-4 gap-0 flex flex-col w-[270px] border-none"
          align="center"
        >
          <>
            <SelectItem value={'all'} className="pl-8 cursor-pointer rounded-none">
              <div className="flex gap-2 items-center py-1">
                <AllChainLogo className="w-10 h-10 p-1" />
                <span className="text-[#0d0229] text-xs font-bold leading-none">All chains</span>
              </div>
            </SelectItem>
          </>
          {xChains.map(xChain => (
            <>
              <Separator className="bg-[#e6e0f7] h-1" key={xChain.xChainId + '_separator'} />
              <SelectItem
                key={xChain.xChainId}
                value={xChain.xChainId}
                className="pl-8 py-2 cursor-pointer rounded-none"
              >
                <div className="flex gap-2 items-center py-1">
                  <ChainLogo chain={xChain} className="w-10 h-10 p-1" />
                  <span className="text-[#0d0229] text-xs font-bold leading-none">{xChain.name}</span>
                </div>
              </SelectItem>
            </>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
