import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import { AppState } from '..';
import { changeBorrowedValue, changeAvailabelValue, changebnUSDbadDebt, changebnUSDtotalSupply } from './actions';

export function useLoanBorrowedValue(): AppState['loan']['borrowedValue'] {
  const borrowedValue = useSelector((state: AppState) => state.loan.borrowedValue);
  return useMemo(() => borrowedValue, [borrowedValue]);
}

export function useLoanAvailabelValue(): AppState['loan']['availabelValue'] {
  const availabelValue = useSelector((state: AppState) => state.loan.availabelValue);
  return useMemo(() => availabelValue, [availabelValue]);
}

export function useLoanbnUSDbadDebt(): AppState['loan']['bnUSDbadDebt'] {
  const bnUSDbadDebt = useSelector((state: AppState) => state.loan.bnUSDbadDebt);
  return useMemo(() => bnUSDbadDebt, [bnUSDbadDebt]);
}

export function useLoanbnUSDtotalSupply(): AppState['loan']['bnUSDtotalSupply'] {
  const bnUSDtotalSupply = useSelector((state: AppState) => state.loan.bnUSDtotalSupply);
  return useMemo(() => bnUSDtotalSupply, [bnUSDtotalSupply]);
}

export function useLoanChangeBorrowedValue(): (borrowedValue: BigNumber) => void {
  const dispatch = useDispatch();
  return useCallback(
    (borrowedValue: BigNumber) => {
      dispatch(changeBorrowedValue({ borrowedValue }));
    },
    [dispatch],
  );
}

export function useLoanChangeAvailabelValue(): (availabelValue: BigNumber) => void {
  const dispatch = useDispatch();
  return useCallback(
    (availabelValue: BigNumber) => {
      dispatch(changeAvailabelValue({ availabelValue }));
    },
    [dispatch],
  );
}

export function useLoanChangebnUSDbadDebt(): (bnUSDbadDebt: BigNumber) => void {
  const dispatch = useDispatch();
  return useCallback(
    (bnUSDbadDebt: BigNumber) => {
      dispatch(changebnUSDbadDebt({ bnUSDbadDebt }));
    },
    [dispatch],
  );
}

export function useLoanChangebnUSDtotalSupply(): (bnUSDtotalSupply: BigNumber) => void {
  const dispatch = useDispatch();
  return useCallback(
    (bnUSDtotalSupply: BigNumber) => {
      dispatch(changebnUSDtotalSupply({ bnUSDtotalSupply }));
    },
    [dispatch],
  );
}
