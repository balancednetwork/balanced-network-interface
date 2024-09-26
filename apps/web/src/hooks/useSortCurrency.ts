import { useSignedInWallets } from '@/hooks/useWallets';
import { calculateTotalBalance, useWalletBalances } from '@/store/wallet/hooks';
import { XToken } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';

type SortingType = {
  key: string;
  order?: 'ASC' | 'DESC';
};

export default function useSortCurrency(initialState: SortingType) {
  const walletBalances = useWalletBalances();
  const signedInWallets = useSignedInWallets();

  const [sortBy, setSortBy] = useState<SortingType>(initialState);

  useEffect(() => {
    if (signedInWallets.length > 0) {
      setSortBy({ key: 'value', order: 'DESC' });
    } else {
      setSortBy({ key: 'symbol', order: 'ASC' });
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

  const sortData = (data: XToken[], rateFracs: {}) => {
    const dataToSort = [...data];
    const direction = sortBy.order === 'ASC' ? -1 : 1;

    if (sortBy.key === 'symbol') {
      dataToSort.sort((a, b) => {
        return a.symbol.toUpperCase() > b.symbol.toUpperCase() ? -1 * direction : 1 * direction;
      });
    }

    if (signedInWallets.length > 0 && sortBy.key === 'value') {
      dataToSort.sort((a, b) => {
        const aBalance = calculateTotalBalance(walletBalances, a) || new BigNumber(0);
        const bBalance = calculateTotalBalance(walletBalances, b) || new BigNumber(0);
        const aValue = aBalance.times(new BigNumber(rateFracs[a.symbol]?.toFixed(8) || '0'));
        const bValue = bBalance.times(new BigNumber(rateFracs[b.symbol]?.toFixed(8) || '0'));
        return aValue.isGreaterThan(bValue) ? -1 * direction : 1 * direction;
      });
    }

    if (signedInWallets.length === 0 && sortBy.key === 'price') {
      dataToSort.sort((a, b) => {
        if (!rateFracs[a.symbol] || !rateFracs[b.symbol]) return 0;
        return rateFracs[a.symbol].greaterThan(rateFracs[b.symbol]) ? -1 * direction : 1 * direction;
      });
    }

    return dataToSort;
  };

  return { sortBy, handleSortSelect, sortData };
}
