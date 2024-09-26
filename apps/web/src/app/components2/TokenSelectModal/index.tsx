import * as React from 'react';

import { filterTokens, useSortedTokensByQuery } from '@/app/components/SearchModal/filtering';
import { useTokenComparator } from '@/app/components/SearchModal/sorting';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { Modal } from '@/app/components2/Modal';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
import useDebounce from '@/hooks/useDebounce';
import { allXTokens } from '@/xwagmi/constants/xTokens';
import { useMemo, useState } from 'react';

export function TokenSelectModal({ open, setOpen, account }) {
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const debouncedQuery = useDebounce(searchQuery, 200);

  const [invertSearchOrder] = useState<boolean>(false);

  const tokenComparator = useTokenComparator(account, invertSearchOrder);

  const allTokens = allXTokens;

  const filteredTokens = useMemo(() => {
    return filterTokens(allTokens, debouncedQuery);
  }, [allTokens, debouncedQuery]);

  const sortedTokens = useMemo(() => {
    return [...filteredTokens].sort(tokenComparator);
  }, [filteredTokens, tokenComparator]);

  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery, false);

  return (
    <Modal open={open} setOpen={setOpen} title="">
      {/* <ScrollArea className="h-[350px] rounded-md border p-4"> */}
      <div className="flex flex-col gap-4">
        <Command className="">
          <CommandInput placeholder="Search framework..." />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {filteredSortedTokens.map(token => (
                <CommandItem
                  key={`${token.symbol}:${token.xChainId}`}
                  value={`${token.symbol}:${token.xChainId}`}
                  onSelect={currentValue => {
                    console.log('currentValue', currentValue);
                  }}
                >
                  <div className="flex gap-4 items-center">
                    <CurrencyLogoWithNetwork currency={token} size="24px" />
                    <span>{token.symbol}</span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </div>
      {/* </ScrollArea> */}
    </Modal>
  );
}
