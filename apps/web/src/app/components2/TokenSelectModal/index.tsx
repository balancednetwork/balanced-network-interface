import * as React from 'react';

import { filterTokens, useSortedTokensByQuery } from '@/app/components/SearchModal/filtering';
import { useTokenComparator } from '@/app/components/SearchModal/sorting';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { Modal } from '@/app/components2/Modal';
import { Input } from '@/components/ui/input';
import useDebounce from '@/hooks/useDebounce';
import { useRatesWithOracle } from '@/queries/reward';
import { allXTokens } from '@/xwagmi/constants/xTokens';
import { useMemo, useState } from 'react';

export function TokenSelectModal({ open, setOpen, account }) {
  const rates = useRatesWithOracle();

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
      <div>
        <Input type="text" placeholder="Search" />
      </div>
      <div className="flex flex-col gap-4">
        {filteredSortedTokens &&
          filteredSortedTokens.map((currency, index) => {
            return (
              <div key={currency.symbol} className="flex gap-4 items-center">
                <CurrencyLogoWithNetwork currency={currency} size="24px" />
                <span>{currency.symbol}</span>
              </div>
            );
          })}
      </div>
    </Modal>
  );
}
