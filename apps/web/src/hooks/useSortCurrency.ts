import { useSignedInWallets } from '@/hooks/useWallets';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { WalletState } from '@/store/wallet/reducer';
import { formatSymbol } from '@/utils/formatter';
import { getXTokenAddress, isXToken } from '@/utils/xTokens';
import { Currency } from '@balancednetwork/sdk-core';
import { SUPPORTED_XCALL_CHAINS, convertCurrency } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { useCallback, useEffect, useState } from 'react';

type SortingType = {
  key: string;
  order?: 'ASC' | 'DESC';
};

const getXCurrencyBalance = (
  xBalances: WalletState,
  currency: Currency,
  selectedChainId: XChainId | undefined,
): BigNumber | undefined => {
  if (!xBalances) return;

  if (selectedChainId) {
    const xToken = convertCurrency(selectedChainId, currency)!;
    return new BigNumber(xBalances[selectedChainId]?.[xToken.address]?.toFixed() || 0);
  } else {
    if (isXToken(currency)) {
      return SUPPORTED_XCALL_CHAINS.reduce((sum, xChainId) => {
        if (xBalances[xChainId]) {
          const tokenAddress = getXTokenAddress(xChainId, currency.symbol);
          const balance = new BigNumber(xBalances[xChainId]?.[tokenAddress ?? -1]?.toFixed() || 0);
          sum = sum.plus(balance);
        }
        return sum;
      }, new BigNumber(0));
    } else {
      return new BigNumber(xBalances['0x1.icon']?.[currency.address]?.toFixed() || 0);
    }
  }
};

export default function useSortCurrency(initialState: SortingType, selectedChainId: XChainId | undefined) {
  const xBalances = useCrossChainWalletBalances();
  const signedInWallets = useSignedInWallets();

  const [sortBy, setSortBy] = useState<SortingType>(initialState);

  useEffect(() => {
    if (signedInWallets.length > 0) {
      setSortBy({ key: 'value', order: 'DESC' });
    } else {
      setSortBy({ key: 'symbol', order: 'ASC' });
    }
  }, [signedInWallets.length]);

  const handleSortSelect = useCallback(
    (clickedSortBy: SortingType) => {
      if (clickedSortBy.key === sortBy.key && !clickedSortBy.order) {
        if (!sortBy.order) {
          clickedSortBy.order = clickedSortBy.key === 'symbol' ? 'ASC' : 'DESC';
        } else {
          sortBy.order === 'DESC' ? (clickedSortBy.order = 'ASC') : (clickedSortBy.order = 'DESC');
        }
      } else {
        clickedSortBy.order = clickedSortBy.order || (clickedSortBy.key === 'symbol' ? 'ASC' : 'DESC');
      }
      setSortBy(clickedSortBy);
    },
    [sortBy],
  );

  const sortData = useCallback(
    (data: Currency[], rateFracs: {}) => {
      const dataToSort = [...data];
      const direction = sortBy.order === 'ASC' ? -1 : 1;

      if (sortBy.key === 'symbol') {
        dataToSort.sort((a, b) => {
          return formatSymbol(a.symbol).toUpperCase() > formatSymbol(b.symbol).toUpperCase()
            ? -1 * direction
            : 1 * direction;
        });
      }

      if (signedInWallets.length > 0 && sortBy.key === 'value') {
        dataToSort.sort((a, b) => {
          const aBalance = getXCurrencyBalance(xBalances, a, selectedChainId) || new BigNumber(0);
          const bBalance = getXCurrencyBalance(xBalances, b, selectedChainId) || new BigNumber(0);
          const aValue = aBalance.times(new BigNumber(rateFracs[a.symbol]?.toFixed(8) || '0'));
          const bValue = bBalance.times(new BigNumber(rateFracs[b.symbol]?.toFixed(8) || '0'));
          return aValue.isGreaterThan(bValue) ? -1 * direction : 1 * direction;
        });
      }

      if (sortBy.key === 'price') {
        dataToSort.sort((a, b) => {
          if (!rateFracs[a.symbol] || !rateFracs[b.symbol]) return 0;
          return rateFracs[a.symbol].greaterThan(rateFracs[b.symbol]) ? -1 * direction : 1 * direction;
        });
      }

      return dataToSort;
    },
    [sortBy, signedInWallets, xBalances, selectedChainId],
  );

  return { sortBy, handleSortSelect, sortData };
}
