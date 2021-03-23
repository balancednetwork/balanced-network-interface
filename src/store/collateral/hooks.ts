import React, { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { useAllTransactions } from 'store/transactions/hooks';

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
export function useFetchCollateralInfo(account?: string | null) {
  const changeStakedICXAmount = useChangeDepositedValue();
  const changeUnStackedICXAmount = useChangeBalanceValue();
  const transactions = useAllTransactions();

  const fetchCollateralInfo = React.useCallback(
    (account: string) => {
      Promise.all([
        bnJs.Loans.eject({ account }).getAccountPositions(),
        bnJs.contractSettings.provider.getBalance(account).execute(),
      ]).then(([stakedICXResult, balance]: Array<any>) => {
        const stakedICXVal = stakedICXResult['assets']
          ? convertLoopToIcx(new BigNumber(parseInt(stakedICXResult['assets']['sICX'], 16)))
          : new BigNumber(0);
        const unStakedVal = convertLoopToIcx(balance);

        changeStakedICXAmount(stakedICXVal);
        changeUnStackedICXAmount(unStakedVal);
      });
    },
    [changeUnStackedICXAmount, changeStakedICXAmount],
  );

  React.useEffect(() => {
    if (account) {
      fetchCollateralInfo(account);
    }
  }, [fetchCollateralInfo, account, transactions]);
}
