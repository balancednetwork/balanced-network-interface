import * as React from 'react';

// import { filterTokens, useSortedTokensByQuery } from '@/app/components/SearchModal/filtering';
import { useTokenComparator } from '@/app/components/SearchModal/sorting';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { Modal } from '@/app/components2/Modal';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { ScrollArea } from '@/components/ui/scroll-area';
// import useDebounce from '@/hooks/useDebounce';
import { allXTokens } from '@/xwagmi/constants/xTokens';
import { useMemo, useState } from 'react';

export function TokenSelectModal({ open, onDismiss, account, onCurrencySelect, selectedCurrency }) {
  // const [searchQuery, setSearchQuery] = React.useState<string>('');
  // const debouncedQuery = useDebounce(searchQuery, 200);

  const [invertSearchOrder] = useState<boolean>(false);

  const tokenComparator = useTokenComparator(account, invertSearchOrder);

  const allTokens = allXTokens;

  // const filteredTokens = useMemo(() => {
  //   return filterTokens(allTokens, debouncedQuery);
  // }, [allTokens, debouncedQuery]);

  const sortedTokens = useMemo(() => {
    return allTokens.sort(tokenComparator);
  }, [allTokens, tokenComparator]);

  // const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery, false);

  return (
    <Modal open={open} onDismiss={onDismiss} title="" hideCloseIcon={true}>
      <div className="flex flex-col gap-4">
        <Command className="bg-transparent flex flex-col gap-4">
          <div className="bg-[#221542] rounded-xl">
            <CommandInput placeholder="Search tokens..." className="text-primary-foreground !text-subtitle" />
          </div>
          <CommandList className="max-h-full overflow-y-hidden">
            <ScrollArea className="h-[350px] border-none">
              <CommandEmpty className="text-primary-foreground">No token found.</CommandEmpty>
              <CommandGroup>
                {sortedTokens.map(token => (
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
