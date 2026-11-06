import { CollateralTab } from '@/app/components/CollateralTypeSwitcher/CollateralTypeListWrap';
import { useRatesWithOracle } from '@/queries/reward';
import { XPositionsRecord } from '@balancednetwork/xwagmi';
import { useCallback, useState } from 'react';
import { SortingType } from './useSort';
import { useSignedInWallets } from './useWallets';
import { DEFAULT_X_COLLATERAL_SORT, sortXCollateralTypes } from './xCollateralSort';

export default function useSortXCollateralTypes() {
  const signedInWallets = useSignedInWallets();
  const prices = useRatesWithOracle();
  const [sortBy, setSortBy] = useState<SortingType>({ ...DEFAULT_X_COLLATERAL_SORT });

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

  const sortData = (data: XPositionsRecord[] | undefined, tab: CollateralTab) => {
    return sortXCollateralTypes(data, tab, sortBy, prices, signedInWallets.length > 0 || tab === CollateralTab.ALL);
  };

  return { sortBy, handleSortSelect, sortData };
}
