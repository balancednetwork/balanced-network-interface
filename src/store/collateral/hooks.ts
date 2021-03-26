import React, { useCallback, useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { convertLoopToIcx } from 'packages/icon-react/utils';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { useRatioValue } from 'store/ratio/hooks';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '../index';
import { adjust, cancel, changeBalance, changeDeposite, type, Field } from './actions';

export function useChangeDepositedValue(): (depositedValue: BigNumber) => void {
  const dispatch = useDispatch();
  return useCallback(
    (depositedValue: BigNumber) => {
      dispatch(changeDeposite({ depositedValue }));
    },
    [dispatch],
  );
}

export function useSICXAmount() {
  const sICXAmount = useSelector((state: AppState) => state.collateral.depositedValue);
  return sICXAmount;
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

export function useICXAmount() {
  const ICXAmount = useSelector((state: AppState) => state.collateral.balance);
  return ICXAmount;
}

export function useDepositedValue(): AppState['collateral']['depositedValue'] {
  const depositedValue = useSelector((state: AppState) => state.collateral.depositedValue);
  return useMemo(() => depositedValue, [depositedValue]);
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

export function useCollateralState() {
  const state = useSelector((state: AppState) => state.collateral.state);
  return state;
}

export function useCollateralType(): (payload: {
  independentField?: Field;
  typedValue?: string;
  inputType?: 'slider' | 'text';
}) => void {
  const dispatch = useDispatch();

  return useCallback(
    payload => {
      dispatch(type(payload));
    },
    [dispatch],
  );
}

export function useCollateralAdjust(): (isAdjust: boolean) => void {
  const dispatch = useDispatch();

  return useCallback(
    isAdjust => {
      if (isAdjust) {
        dispatch(adjust());
      } else {
        dispatch(cancel());
      }
    },
    [dispatch],
  );
}

export const useStakedICXAmount = () => {
  const sICXAmount = useSICXAmount();

  const ratio = useRatioValue();

  return React.useMemo(() => {
    const stakedICXAmount = sICXAmount.multipliedBy(ratio.sICXICXratio);

    return stakedICXAmount;
  }, [sICXAmount, ratio.sICXICXratio]);
};

export const useTotalICXAmount = () => {
  const ICXAmount = useICXAmount();

  const stakedICXAmount = useStakedICXAmount();

  return React.useMemo(() => {
    const totalICXAmount = stakedICXAmount.plus(ICXAmount);
    return totalICXAmount;
  }, [stakedICXAmount, ICXAmount]);
};

export const useCollateralInputAmount = () => {
  const { independentField, typedValue } = useCollateralState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const totalICXAmount = useTotalICXAmount();

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalICXAmount.minus(new BigNumber(typedValue || '0')),
  };

  return parsedAmount[Field.LEFT];
};
