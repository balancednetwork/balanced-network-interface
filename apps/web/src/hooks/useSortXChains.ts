import { useWalletBalances } from '@/store/wallet/hooks';
import { WalletState } from '@/store/wallet/reducer';
import { XChain } from '@/xwagmi/types';
import { Currency, XChainId } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';
import { useSignedInWallets } from './useWallets';

type SortingType = {
  key: string;
  order?: 'ASC' | 'DESC';
};

export default function useSortXChains(initialState: SortingType) {
  const walletBalances = useWalletBalances();
  const signedInWallets = useSignedInWallets();

  const [sortBy, setSortBy] = useState<SortingType>(initialState);

  useEffect(() => {
    if (signedInWallets.length > 0) {
      setSortBy({ key: 'value', order: 'DESC' });
    } else {
      setSortBy({ key: 'name', order: 'ASC' });
    }
  }, [signedInWallets.length]);

  const handleSortSelect = (clickedSortBy: SortingType) => {
    if (clickedSortBy.key === sortBy.key) {
      sortBy.order === 'DESC' ? (clickedSortBy.order = 'ASC') : (clickedSortBy.order = 'DESC');
    } else {
      clickedSortBy.order = 'DESC';
    }
    setSortBy(clickedSortBy);
  };

  const sortData = (data: XChain[], selectedCurrency: Currency) => {
    const dataToSort = [...data];
    const direction = sortBy.order === 'ASC' ? -1 : 1;

    if (sortBy.key === 'name') {
      dataToSort.sort((a, b) => {
        return a.name.toUpperCase() > b.name.toUpperCase() ? -1 * direction : 1 * direction;
      });
    }

    if (signedInWallets.length > 0 && sortBy.key === 'value') {
      dataToSort.sort((a, b) => {
        const aBalance =
          new BigNumber(walletBalances[selectedCurrency.wrapped.address].toFixed() || 0) || new BigNumber(0);
        const bBalance =
          new BigNumber(walletBalances[selectedCurrency.wrapped.address].toFixed() || 0) || new BigNumber(0);
        return aBalance.isGreaterThan(bBalance) ? -1 * direction : 1 * direction;
      });
    }

    return dataToSort;
  };

  return { sortBy, handleSortSelect, sortData };
}
