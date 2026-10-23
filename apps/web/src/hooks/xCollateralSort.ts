import type { Position, XPositionsRecord } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';

import type { SortingType } from './useSort';

export type XCollateralSortTab = 'all' | 'your';
export type XCollateralPrices = Record<string, BigNumber | undefined>;

export const DEFAULT_X_COLLATERAL_SORT: SortingType = { key: 'loan', order: 'DESC' };

const getPositionCollateralAmount = (
  xPositionsRecord: XPositionsRecord,
  collateralTab: XCollateralSortTab,
  checkPotential = false,
): BigNumber => {
  if (collateralTab === 'all') {
    return new BigNumber(xPositionsRecord.total?.collateral?.toFixed() || 0);
  }

  return Object.values(xPositionsRecord.positions).reduce((acc, position) => {
    const currentPosition = position as Position;
    if (currentPosition.collateral && checkPotential === !!currentPosition.isPotential) {
      return acc.plus(currentPosition.collateral.toFixed());
    }
    return acc;
  }, new BigNumber(0));
};

const getPositionCollateralValue = (
  xPositionsRecord: XPositionsRecord,
  collateralTab: XCollateralSortTab,
  price: BigNumber | undefined,
  checkPotential = false,
): BigNumber => {
  const amount = getPositionCollateralAmount(xPositionsRecord, collateralTab, checkPotential);
  return collateralTab === 'all' ? amount : amount.times(price || 0);
};

const getPositionLoan = (xPositionsRecord: XPositionsRecord, collateralTab: XCollateralSortTab): BigNumber => {
  if (collateralTab === 'all') {
    return new BigNumber(xPositionsRecord.total?.loan?.toFixed() || 0);
  }

  return Object.values(xPositionsRecord.positions).reduce((acc, position) => {
    const currentPosition = position as Position;
    return currentPosition.loan ? acc.plus(currentPosition.loan) : acc;
  }, new BigNumber(0));
};

const compareValues = (a: BigNumber, b: BigNumber, order: SortingType['order']): number => {
  const comparison = a.comparedTo(b);
  return order === 'ASC' ? comparison : -comparison;
};

export function sortXCollateralTypes(
  data: XPositionsRecord[] | undefined,
  tab: XCollateralSortTab,
  sortBy: SortingType,
  prices: XCollateralPrices | undefined,
  canSortPositions: boolean,
): XPositionsRecord[] {
  const dataToSort = [...(data || [])];

  if (sortBy.key === 'name') {
    return dataToSort.sort((a, b) => {
      const symbolA = a.baseToken.symbol.replace('sICX', 'ICX').toUpperCase();
      const symbolB = b.baseToken.symbol.replace('sICX', 'ICX').toUpperCase();
      return sortBy.order === 'ASC' ? symbolA.localeCompare(symbolB) : symbolB.localeCompare(symbolA);
    });
  }

  if (!canSortPositions) return dataToSort;

  if (sortBy.key === 'collateral') {
    return dataToSort.sort((a, b) => {
      const aAmount = getPositionCollateralAmount(a, tab);
      const bAmount = getPositionCollateralAmount(b, tab);

      if (tab === 'your' && aAmount.isGreaterThan(0) !== bAmount.isGreaterThan(0)) {
        return aAmount.isGreaterThan(0) ? -1 : 1;
      }

      const aPosition = getPositionCollateralValue(a, tab, prices?.[a.baseToken.symbol]);
      const bPosition = getPositionCollateralValue(b, tab, prices?.[b.baseToken.symbol]);
      const positionComparison = compareValues(aPosition, bPosition, sortBy.order);

      if (!aPosition.isZero() || !bPosition.isZero()) return positionComparison;

      const aPotential = getPositionCollateralValue(a, tab, prices?.[a.baseToken.symbol], true);
      const bPotential = getPositionCollateralValue(b, tab, prices?.[b.baseToken.symbol], true);
      return compareValues(aPotential, bPotential, sortBy.order);
    });
  }

  if (sortBy.key === 'loan') {
    return dataToSort.sort((a, b) => compareValues(getPositionLoan(a, tab), getPositionLoan(b, tab), sortBy.order));
  }

  return dataToSort;
}
