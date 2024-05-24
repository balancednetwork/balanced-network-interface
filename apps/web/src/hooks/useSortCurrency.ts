import { Currency } from '@balancednetwork/sdk-core';
import { getCurrencyDecimalDisplay } from 'app/components/SearchModal/CurrencyList';
import { SUPPORTED_XCALL_CHAINS } from 'app/pages/trade/bridge/_config/xTokens';
import { isXToken, getCrossChainTokenAddress } from 'app/pages/trade/bridge/utils';
import BigNumber from 'bignumber.js';
import { useEffect, useState } from 'react';
import { useCrossChainWalletBalances, useSignedInWallets } from 'store/wallet/hooks';
import { WalletState } from 'store/wallet/reducer';

type SortingType = {
  key: string;
  order?: 'ASC' | 'DESC';
};

const getXCurrencyBalance = (xBalances: WalletState, currency: Currency): BigNumber | undefined => {
  if (isXToken(currency)) {
    return SUPPORTED_XCALL_CHAINS.reduce((sum, xChainId) => {
      if (xBalances[xChainId]) {
        const tokenAddress = getCrossChainTokenAddress(xChainId, currency.wrapped.symbol);
        const balance = new BigNumber(xBalances[xChainId]?.[tokenAddress ?? -1]?.toFixed() || 0);
        sum = sum.plus(balance);
      }
      return sum;
    }, new BigNumber(0));
  } else {
    return new BigNumber(xBalances['0x1.icon']?.[currency.wrapped.address]?.toFixed() || 0);
  }
};

export default function useSortCurrency(initialState: SortingType) {
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

  const handleSortSelect = (clickedSortBy: SortingType) => {
    if (clickedSortBy.key === sortBy.key) {
      sortBy.order === 'DESC' ? (clickedSortBy.order = 'ASC') : (clickedSortBy.order = 'DESC');
    } else {
      clickedSortBy.order = 'DESC';
    }
    setSortBy(clickedSortBy);
  };

  const sortData = (data: Currency[], rateFracs: {}) => {
    const dataToSort = [...data];
    const direction = sortBy.order === 'ASC' ? -1 : 1;

    if (sortBy.key === 'symbol') {
      dataToSort.sort((a, b) => {
        // if (a.symbol === 'ICX') return -1;
        // if (b.symbol === 'ICX') return 1;
        return a.symbol.toUpperCase() > b.symbol.toUpperCase() ? -1 * direction : 1 * direction;
      });
    }

    if (signedInWallets.length > 0 && sortBy.key === 'value') {
      dataToSort.sort((a, b) => {
        const aBalance = getXCurrencyBalance(xBalances, a) || new BigNumber(0);
        const bBalance = getXCurrencyBalance(xBalances, b) || new BigNumber(0);
        const aValue =
          (rateFracs &&
            rateFracs[a.symbol!] &&
            aBalance.times(new BigNumber(rateFracs[a.symbol!].toFixed(8))).toFormat(2)) ||
          0;
        const bValue =
          (rateFracs &&
            rateFracs[b.symbol!] &&
            bBalance.times(new BigNumber(rateFracs[b.symbol!].toFixed(8))).toFormat(2)) ||
          0;
        return aValue > bValue ? -1 * direction : 1 * direction;
      });
    }

    if (signedInWallets.length === 0 && sortBy.key === 'price') {
      dataToSort.sort((a, b) => {
        const aPrice =
          (rateFracs &&
            rateFracs[a.symbol!] &&
            rateFracs[a.symbol!].toFixed(getCurrencyDecimalDisplay(rateFracs[a.symbol!]), {
              groupSeparator: ',',
            })) ||
          0;
        const bPrice =
          (rateFracs &&
            rateFracs[b.symbol!] &&
            rateFracs[b.symbol!].toFixed(getCurrencyDecimalDisplay(rateFracs[b.symbol!]), {
              groupSeparator: ',',
            })) ||
          0;
        return aPrice > bPrice ? -1 * direction : 1 * direction;
      });
    }

    return dataToSort;
  };

  return { sortBy, handleSortSelect, sortData };
}
