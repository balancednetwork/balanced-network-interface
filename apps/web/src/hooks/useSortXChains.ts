import { useRatesWithOracle } from '@/queries/reward';
import { useUserPositionsData } from '@/store/collateral/hooks';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { WalletState } from '@/store/wallet/reducer';
import { Currency } from '@balancednetwork/sdk-core';
import { XChain, XChainId } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { useCallback, useEffect, useState } from 'react';
import { SortingType } from './useSort';
import { useSignedInWallets } from './useWallets';

const getXCurrencyBalanceBySymbol = (
  xBalances: WalletState,
  symbol: string,
  selectedChainId: XChainId | undefined,
): BigNumber | undefined => {
  if (!xBalances || !selectedChainId) return;

  const currencyAmount = Object.values(xBalances[selectedChainId] || {}).find(
    currencyAmount => currencyAmount.currency.symbol === symbol,
  );

  return new BigNumber(currencyAmount?.toFixed() || 0);
};

export default function useSortXChains(
  initialState: SortingType,
  selectedCurrency: Currency | undefined,
  useTotal?: boolean,
) {
  const xBalances = useCrossChainWalletBalances();
  const signedInWallets = useSignedInWallets();
  const prices = useRatesWithOracle();

  const [sortBy, setSortBy] = useState<SortingType>(initialState);

  useEffect(() => {
    if (signedInWallets.length > 0) {
      setSortBy({ key: 'value', order: 'DESC' });
    } else {
      setSortBy({ key: 'name', order: 'ASC' });
    }
  }, [signedInWallets.length]);

  const handleSortSelect = useCallback(
    (clickedSortBy: SortingType) => {
      if (clickedSortBy.key === sortBy.key && !clickedSortBy.order) {
        if (!sortBy.order) {
          clickedSortBy.order = clickedSortBy.key === 'name' ? 'ASC' : 'DESC';
        } else {
          sortBy.order === 'DESC' ? (clickedSortBy.order = 'ASC') : (clickedSortBy.order = 'DESC');
        }
      } else {
        clickedSortBy.order = clickedSortBy.order || (clickedSortBy.key === 'name' ? 'ASC' : 'DESC');
      }
      setSortBy(clickedSortBy);
    },
    [sortBy],
  );

  const sortData = (data: XChain[], selectedCurrency: Currency) => {
    const dataToSort = [...data];
    const direction = sortBy.order === 'ASC' ? -1 : 1;

    if (sortBy.key === 'name') {
      dataToSort.sort((a, b) => {
        return a.name.toUpperCase() > b.name.toUpperCase() ? -1 * direction : 1 * direction;
      });
    }

    if (signedInWallets.length > 0 && sortBy.key === 'value') {
      if (useTotal) {
        dataToSort.sort((a, b) => {
          const aTotal = Object.values(xBalances[a.xChainId] || {}).reduce((total, currAmount) => {
            const currPrice = prices?.[currAmount.currency.symbol];
            if (currPrice) {
              return total.plus(currPrice.times(new BigNumber(currAmount.toFixed())));
            }
            return total;
          }, new BigNumber(0));

          const bTotal = Object.values(xBalances[b.xChainId] || {}).reduce((total, currAmount) => {
            const currPrice = prices?.[currAmount.currency.symbol];
            if (currPrice) {
              return total.plus(currPrice.times(new BigNumber(currAmount.toFixed())));
            }
            return total;
          }, new BigNumber(0));

          return aTotal.isGreaterThan(bTotal) ? -1 * direction : 1 * direction;
        });
      } else {
        dataToSort
          .sort((a, b) => {
            const aBalance =
              getXCurrencyBalanceBySymbol(xBalances, selectedCurrency.symbol, a.xChainId) || new BigNumber(0);
            const bBalance =
              getXCurrencyBalanceBySymbol(xBalances, selectedCurrency.symbol, b.xChainId) || new BigNumber(0);
            return aBalance.isGreaterThan(bBalance) ? -1 * direction : 1 * direction;
          })
          .sort((a, b) => {
            const aBalance =
              getXCurrencyBalanceBySymbol(xBalances, selectedCurrency.symbol, a.xChainId) || new BigNumber(0);
            const bBalance =
              getXCurrencyBalanceBySymbol(xBalances, selectedCurrency.symbol, b.xChainId) || new BigNumber(0);

            if (aBalance.isEqualTo(bBalance) || (aBalance.isLessThan(0.01) && bBalance.isLessThan(0.01))) {
              return a.name.localeCompare(b.name);
            }
            return 0;
          });
      }
    }

    return dataToSort;
  };

  return { sortBy, handleSortSelect, sortData };
}
