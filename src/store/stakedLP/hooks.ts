import React from 'react';

import { CurrencyAmount, Currency } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import { ZERO } from 'constants/index';
import { useBalance } from 'hooks/useV2Pairs';
import { AppState } from 'store';

import { setStakedLPPercent, setWithdrawnValue } from './actions';

export function useChangeStakedLPPercent(): (poolId: number, percent: BigNumber) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (poolId, percent) => {
      dispatch(setStakedLPPercent({ poolId, percent }));
    },
    [dispatch],
  );
}

export function useChangeWithdrawnValue(): (
  poolId: number,
  percent: BigNumber,
  baseValue: CurrencyAmount<Currency>,
  quoteValue: CurrencyAmount<Currency>,
) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (poolId, percent, baseValue, quoteValue) => {
      dispatch(setWithdrawnValue({ poolId, percent, baseValue, quoteValue }));
    },
    [dispatch],
  );
}

export const useTotalStaked = (poolId: number) => {
  const balance = useBalance(poolId);

  const stakedBalance = balance?.stakedLPBalance || ZERO;
  const availableStake = balance?.balance || ZERO;

  return React.useMemo(
    () => new BigNumber(stakedBalance.toFixed()).plus(availableStake.toFixed()),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [stakedBalance.toFixed(), availableStake.toFixed()],
  );
};

export function useStakedLPPercent(poolId: number): BigNumber {
  return useSelector((state: AppState) => state.stakedLP.stakedLp[poolId] ?? ZERO);
}

export function useWithdrawnPercent(poolId: number) {
  return useSelector((state: AppState) => state.stakedLP.withdrawn[poolId]);
}
