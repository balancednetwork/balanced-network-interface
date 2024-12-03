import { CollateralTab } from '@/app/components/CollateralTypeSwitcher/CollateralTypeListWrap';
import { useRatesWithOracle } from '@/queries/reward';
import { Position, XChain, XChainId, XPositionsRecord } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { useCallback, useEffect, useState } from 'react';
import { SortingType } from './useSort';
import { useSignedInWallets } from './useWallets';

const getPositionValue = (
  xPositionsRecord: XPositionsRecord,
  collateralTab: CollateralTab,
  price: BigNumber,
  checkPotential?: boolean,
): BigNumber | undefined => {
  if (!xPositionsRecord) return;

  let total = new BigNumber(0);

  if (collateralTab === CollateralTab.ALL) {
    total = new BigNumber(xPositionsRecord.total?.collateral?.toFixed() || 0);
  }

  if (collateralTab === CollateralTab.YOUR) {
    total = Object.values(xPositionsRecord.positions).reduce((acc, position) => {
      const currentPosition = position as Position;
      if (currentPosition.collateral && !!checkPotential === !!currentPosition.isPotential) {
        acc = acc.plus(new BigNumber(currentPosition.collateral.toFixed()));
      }
      return acc;
    }, total);
  }

  return total.times(price);
};

const getPositionLoan = (xPositionsRecord: XPositionsRecord, collateralTab: CollateralTab): BigNumber | undefined => {
  if (!xPositionsRecord) return;

  let total = new BigNumber(0);

  if (collateralTab === CollateralTab.ALL) {
    total = new BigNumber(xPositionsRecord.total?.loan?.toFixed() || 0);
  }

  if (collateralTab === CollateralTab.YOUR) {
    total = Object.values(xPositionsRecord.positions).reduce((acc, position) => {
      const currentPosition = position as Position;
      if (currentPosition.loan) {
        acc = acc.plus(new BigNumber(currentPosition.loan.toFixed()));
      }
      return acc;
    }, total);
  }

  return total;
};

export default function useSortXCollateralTypes(initialState: SortingType) {
  const signedInWallets = useSignedInWallets();
  const prices = useRatesWithOracle();
  const [sortBy, setSortBy] = useState<SortingType>(initialState);

  useEffect(() => {
    if (signedInWallets.length > 0) {
      setSortBy({ key: 'collateral', order: 'DESC' });
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

  const sortData = (data: XPositionsRecord[] | undefined, tab: CollateralTab) => {
    const dataToSort = [...(data || [])];
    const direction = sortBy.order === 'ASC' ? -1 : 1;

    if (sortBy.key === 'name') {
      dataToSort.sort((a, b) => {
        return a.baseToken.name!.toUpperCase() > b.baseToken.name!.toUpperCase() ? -1 * direction : 1 * direction;
      });
    }

    if ((signedInWallets.length > 0 || tab === CollateralTab.ALL) && sortBy.key === 'collateral') {
      dataToSort.sort((a, b) => {
        if (!prices || !prices[a.baseToken.symbol] || !prices[b.baseToken.symbol]) return 0;

        const aPosition = getPositionValue(a, tab, prices[a.baseToken.symbol]);
        const bPosition = getPositionValue(b, tab, prices[b.baseToken.symbol]);
        const aPositionPotential = getPositionValue(a, tab, prices[a.baseToken.symbol], true);
        const bPositionPotential = getPositionValue(b, tab, prices[b.baseToken.symbol], true);

        if (aPosition?.isGreaterThan(0) && bPosition?.isGreaterThan(0)) {
          return aPosition.isGreaterThan(bPosition) ? -1 * direction : 1 * direction;
        }

        if (aPosition?.isGreaterThan(0)) {
          return -1 * direction;
        }

        if (bPosition?.isGreaterThan(0)) {
          return 1 * direction;
        }

        if (aPositionPotential?.isGreaterThan(0) && bPositionPotential?.isGreaterThan(0)) {
          return aPositionPotential.isGreaterThan(bPositionPotential) ? -1 * direction : 1 * direction;
        }

        return 0;
      });
    }

    if ((signedInWallets.length > 0 || tab === CollateralTab.ALL) && sortBy.key === 'loan') {
      dataToSort.sort((a, b) => {
        const aLoan = getPositionLoan(a, tab);
        const bLoan = getPositionLoan(b, tab);

        if (!aLoan || !bLoan) return 0;

        return aLoan.isGreaterThan(bLoan) ? -1 * direction : 1 * direction;
      });
    }

    return dataToSort;
  };

  return { sortBy, handleSortSelect, sortData };
}
