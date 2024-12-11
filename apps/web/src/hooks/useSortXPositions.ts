import { useRatesWithOracle } from '@/queries/reward';
import { useUserPositionsData } from '@/store/collateral/hooks';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { WalletState } from '@/store/wallet/reducer';
import { Currency } from '@balancednetwork/sdk-core';
import { Position, XChain, XChainId, XPositionsRecord } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { useCallback, useEffect, useState } from 'react';
import { SortingType } from './useSort';
import { useSignedInWallets } from './useWallets';

const getPosition = (
  xPositions: XPositionsRecord[] | undefined,
  collateralType: string,
  xChainId: XChainId,
): Position | undefined => {
  if (!xPositions || !collateralType) return;

  const xPositionRecord = xPositions.find(xPosition => xPosition.baseToken.symbol === collateralType);
  const position = xPositionRecord?.positions[xChainId];

  return position ? (position as Position) : undefined;
};

export default function useSortXChainsByPosition(initialState: SortingType, collateralType: string) {
  const { data: userPositionsData } = useUserPositionsData();
  const signedInWallets = useSignedInWallets();
  const prices = useRatesWithOracle();

  const [sortBy, setSortBy] = useState<SortingType>(initialState);

  useEffect(() => {
    if (signedInWallets.length > 0) {
      setSortBy({ key: 'position', order: 'DESC' });
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

  const sortData = (data: XChain[], collateralType: string) => {
    const dataToSort = [...data];
    const direction = sortBy.order === 'ASC' ? -1 : 1;

    if (sortBy.key === 'name') {
      dataToSort.sort((a, b) => {
        return a.name.toUpperCase() > b.name.toUpperCase() ? -1 * direction : 1 * direction;
      });
    }

    if (signedInWallets.length > 0 && sortBy.key === 'position') {
      dataToSort.sort((a, b) => {
        const aPosition = getPosition(userPositionsData, collateralType, a.xChainId);
        const bPosition = getPosition(userPositionsData, collateralType, b.xChainId);

        if (!aPosition || !bPosition || !aPosition.collateral || !bPosition.collateral) return 0;

        if (aPosition.isPotential && bPosition.isPotential) {
          return aPosition.collateral.greaterThan(bPosition.collateral) ? 1 * direction : -1 * direction;
        } else if (aPosition.isPotential && !bPosition.isPotential) {
          return 1 * direction;
        } else if (!aPosition.isPotential && bPosition.isPotential) {
          return -1 * direction;
        } else {
          return aPosition.collateral.greaterThan(bPosition.collateral) ? -1 * direction : 1 * direction;
        }
      });
    }

    return dataToSort;
  };

  return { sortBy, handleSortSelect, sortData };
}
