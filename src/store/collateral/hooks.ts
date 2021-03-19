import { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import { AppState } from '../index';
import { changeBalance, changeDeposite } from './actions';

export function useChangeDepositedValue(): (depositedValue: BigNumber) => void {
  const dispatch = useDispatch();
  return useCallback(
    (depositedValue: BigNumber) => {
      dispatch(changeDeposite({ depositedValue }));
    },
    [dispatch],
  );
}

export function useChangeBalanceValue(): (balance: BigNumber) => void {
  const dispatch = useDispatch();
  return useCallback(
    (balance: BigNumber) => {
      dispatch(changeBalance({ balance }));
    },
    [dispatch],
  );
}

export function useDepositedValue(): AppState['collateral']['depositedValue'] {
  const depositedValue = useSelector((state: AppState) => state.collateral.depositedValue);
  return useMemo(() => depositedValue, [depositedValue]);
}

export function useBalance(): AppState['collateral']['balance'] {
  const balance = useSelector((state: AppState) => state.collateral.balance);
  return useMemo(() => balance, [balance]);
}
