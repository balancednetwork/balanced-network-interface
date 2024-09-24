import * as React from 'react';

import { CurrencySelectionType } from '@/app/components/SearchModal/CurrencySearch';
import { filterTokens, useSortedTokensByQuery } from '@/app/components/SearchModal/filtering';
import { useTokenComparator } from '@/app/components/SearchModal/sorting';
import CurrencyLogoWithNetwork from '@/app/components2/CurrencyLogoWithNetwork';
import { Modal } from '@/app/components2/Modal';
import { Input } from '@/components/ui/input';
import { useICX } from '@/constants/tokens';
import { useAllTokens, useCommonBases } from '@/hooks/Tokens';
import useDebounce from '@/hooks/useDebounce';
import useSortCurrency from '@/hooks/useSortCurrency';
import { useRatesWithOracle } from '@/queries/reward';
import { toFraction } from '@/utils';
import { ICON_XCALL_NETWORK_ID } from '@/xwagmi/constants';
import { xTokenMap } from '@/xwagmi/constants/xTokens';
import { Currency, Token } from '@balancednetwork/sdk-core';
import { useMemo, useState } from 'react';

const useFilteredXTokens = () => {
  const tokens = useAllTokens();

  return useMemo(() => {
    const allTokens = Object.values(tokens);
    const allXTokens = Object.values(xTokenMap).flat();
    return allXTokens.filter(x => !allTokens.some(t => t.symbol === x.symbol));
  }, [tokens]);
};

export function TokenSelectModal({ open, setOpen, account }) {
  const rates = useRatesWithOracle();
  const rateFracs = React.useMemo(() => {
    if (rates) {
      return Object.keys(rates).reduce((acc, key) => {
        acc[key] = toFraction(rates[key]);
        return acc;
      }, {});
    }
  }, [rates]);

  const currencySelectionType: CurrencySelectionType = CurrencySelectionType.NORMAL;

  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const debouncedQuery = useDebounce(searchQuery, 200);

  const [invertSearchOrder] = useState<boolean>(false);

  const tokens = useAllTokens();
  const filteredXTokens = useFilteredXTokens();

  const tokenComparator = useTokenComparator(account, invertSearchOrder);

  // @ts-ignore
  const allTokens: { [address: string]: Token } = useMemo(() => {
    return { ...tokens, ...filteredXTokens };
  }, [tokens, filteredXTokens]);

  const filteredTokens: Token[] = useMemo(() => {
    return filterTokens(Object.values(allTokens), debouncedQuery);
  }, [allTokens, debouncedQuery]);

  const sortedTokens: Token[] = useMemo(() => {
    return [...filteredTokens].sort(tokenComparator);
  }, [filteredTokens, tokenComparator]);

  const icx = useICX();
  const filteredSortedTokens = useSortedTokensByQuery(sortedTokens, debouncedQuery, false);
  const filteredSortedTokensWithICX: Currency[] = useMemo(() => {
    const s = debouncedQuery.toLowerCase().trim();
    if ('0x1.icon'.indexOf(s) >= 0 || 'icx'.indexOf(s) >= 0) {
      return icx ? [icx, ...filteredSortedTokens] : filteredSortedTokens;
    }
    return filteredSortedTokens;
  }, [debouncedQuery, icx, filteredSortedTokens]);

  const currencies = useMemo(() => {
    const currencies =
      currencySelectionType === CurrencySelectionType.NORMAL ||
      currencySelectionType === CurrencySelectionType.TRADE_MINT_BASE
        ? filteredSortedTokensWithICX
        : filteredSortedTokens;

    return currencies;
  }, [currencySelectionType, filteredSortedTokens, filteredSortedTokensWithICX]);

  //   const { sortBy, handleSortSelect, sortData } = useSortCurrency({ key: 'symbol', order: 'ASC' }, selectedChainId);
  //   const sortedCurrencies = React.useMemo(() => {
  //     if (currencies && rateFracs) {
  //       return sortData(currencies, rateFracs);
  //     }
  //   }, [currencies, rateFracs, sortData]);

  return (
    <Modal open={open} setOpen={setOpen} title="">
      <div>
        <Input type="text" placeholder="Search" />
      </div>
      <div className="flex flex-col gap-4">
        {currencies &&
          currencies.map((currency, index) => {
            return (
              <div key={currency.symbol} className="flex gap-4 items-center">
                <CurrencyLogoWithNetwork currency={currency} chainId={ICON_XCALL_NETWORK_ID} size="24px" />
                <span>{currency.symbol}</span>
              </div>
            );
          })}
      </div>
    </Modal>
  );
}
