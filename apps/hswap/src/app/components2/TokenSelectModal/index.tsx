import * as React from 'react';

import { useTokenComparator } from '@/app/components/SearchModal/sorting';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { Modal } from '@/app/components2/Modal';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import { allXTokens } from '@/xwagmi/constants/xTokens';
import { useMemo, useState } from 'react';
import { xChains } from '@/xwagmi/constants/xChains';
import { XChainId } from '@balancednetwork/sdk-core';
import XChainSelect from '../XChainSelect';

export function TokenSelectModal({ open, onDismiss, account, onCurrencySelect, selectedCurrency }) {
  const [invertSearchOrder] = useState<boolean>(false);

  const tokenComparator = useTokenComparator(account, invertSearchOrder);

  // TODO: hide aARCH token temporarily
  const allTokens = allXTokens.filter(token => token.symbol !== 'aARCH');

  const sortedTokens = useMemo(() => {
    return allTokens.sort(tokenComparator);
  }, [allTokens, tokenComparator]);

  const [xChainId, setXChainId] = useState<XChainId>('0x1.icon');

  return (
    <Modal open={open} onDismiss={onDismiss} hideCloseIcon={true} dialogClassName="max-w-[450px]">
      <div className="flex flex-col gap-4">
        <Command className="bg-transparent flex flex-col gap-4">
          <div className="bg-[#221542] rounded-xl relative">
            <CommandInput placeholder="Search tokens..." className="text-primary-foreground !text-subtitle" />
            <XChainSelect
              xChains={xChains}
              value={xChainId}
              onValueChange={value => setXChainId(value)}
              className="absolute right-4 top-2"
            />
          </div>
          <CommandList className="max-h-full overflow-y-hidden">
            <ScrollArea className="h-[350px] border-none">
              <CommandEmpty className="text-primary-foreground">No token found.</CommandEmpty>
              <CommandGroup>
                {sortedTokens
                  .filter(token => token.xChainId === xChainId)
                  .map(token => (
                    <CommandItem
                      key={`${token.symbol}:${token.xChainId}`}
                      value={`${token.symbol}:${token.xChainId}`}
                      onSelect={currentValue => {
                        console.log('currentValue', currentValue);
                        const selectedToken = allTokens.find(
                          token => `${token.symbol}:${token.xChainId}` === currentValue,
                        );
                        if (selectedToken) {
                          console.log('selectedToken', selectedToken);
                          onCurrencySelect(selectedToken);
                          onDismiss();
                        }
                      }}
                      className="cursor-pointer data-[selected='true']:bg-[#221542]"
                    >
                      <div className="flex gap-4 items-center text-white">
                        <CurrencyLogoWithNetwork currency={token} size="32px" />
                        <span>{token.symbol}</span>
                      </div>
                    </CommandItem>
                  ))}
              </CommandGroup>
            </ScrollArea>
          </CommandList>
        </Command>
      </div>
    </Modal>
  );
}
