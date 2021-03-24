import React, { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { useRatioValue } from 'store/ratio/hooks';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { changeBorrowedValue, changeAvailableValue, changebnUSDbadDebt, changebnUSDtotalSupply } from './actions';

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

export function useLoanchangeAvailableValue(): (availabelValue: BigNumber) => void {
  const dispatch = useDispatch();
  return useCallback(
    (availabelValue: BigNumber) => {
      dispatch(changeAvailableValue({ availabelValue }));
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

export function useFetchLoanInfo(account?: string | null) {
  const changeBorrowedValue = useLoanChangeBorrowedValue();
  const changebnUSDbadDebt = useLoanChangebnUSDbadDebt();
  const changebnUSDtotalSupply = useLoanChangebnUSDtotalSupply();

  const transactions = useAllTransactions();

  const fetchLoanInfo = React.useCallback(
    (account: string) => {
      if (account) {
        Promise.all([
          bnJs.Loans.eject({ account }).getAvailableAssets(),
          bnJs.bnUSD.totalSupply(),
          bnJs.Loans.eject({ account }).getAccountPositions(),
        ]).then(([resultGetAvailableAssets, resultbnUSDtotalSupply, resultbnUSDdebt]: Array<any>) => {
          const bnUSDbadDebt = convertLoopToIcx(resultGetAvailableAssets['bnUSD']['bad_debt']);
          const bnUSDtotalSupply = convertLoopToIcx(resultbnUSDtotalSupply);

          const bnUSDdebt = resultbnUSDdebt['assets']
            ? convertLoopToIcx(new BigNumber(parseInt(resultbnUSDdebt['assets']['bnUSD'] || 0, 16)))
            : new BigNumber(0);

          changebnUSDbadDebt(bnUSDbadDebt);
          changebnUSDtotalSupply(bnUSDtotalSupply);
          changeBorrowedValue(bnUSDdebt);
        });
      }
    },
    [changebnUSDbadDebt, changebnUSDtotalSupply, changeBorrowedValue],
  );

  React.useEffect(() => {
    if (account) {
      fetchLoanInfo(account);
    }
  }, [fetchLoanInfo, account, transactions]);
}

const MANDATORY_COLLATERAL_RATIO = 4;

export const useLockedICXAmount = () => {
  const ratio = useRatioValue();

  const bnUSDLoanAmount = useLoanBorrowedValue();

  return React.useMemo(() => {
    const price = ratio.ICXUSDratio.isZero() ? new BigNumber(1) : ratio.ICXUSDratio;
    return bnUSDLoanAmount.multipliedBy(MANDATORY_COLLATERAL_RATIO).div(price);
  }, [bnUSDLoanAmount, ratio.ICXUSDratio]);
};
