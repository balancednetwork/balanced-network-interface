import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { MANDATORY_COLLATERAL_RATIO } from 'constants/index';
import { useCollateralInputAmount } from 'store/collateral/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { changeBorrowedAmount, changeBadDebt, changeTotalSupply, Field, adjust, cancel, type } from './actions';

export function useLoanBorrowedAmount(): AppState['loan']['borrowedAmount'] {
  return useSelector((state: AppState) => state.loan.borrowedAmount);
}

export function useLoanBadDebt(): AppState['loan']['badDebt'] {
  return useSelector((state: AppState) => state.loan.badDebt);
}

export function useLoanTotalSupply(): AppState['loan']['totalSupply'] {
  return useSelector((state: AppState) => state.loan.totalSupply);
}

export function useLoanChangeBorrowedAmount(): (borrowedAmount: BigNumber) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (borrowedAmount: BigNumber) => {
      dispatch(changeBorrowedAmount({ borrowedAmount }));
    },
    [dispatch],
  );
}

export function useLoanChangeBadDebt(): (badDebt: BigNumber) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (badDebt: BigNumber) => {
      dispatch(changeBadDebt({ badDebt }));
    },
    [dispatch],
  );
}

export function useLoanChangeTotalSupply(): (totalSupply: BigNumber) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (totalSupply: BigNumber) => {
      dispatch(changeTotalSupply({ totalSupply }));
    },
    [dispatch],
  );
}

export function useLoanFetchInfo(account?: string | null) {
  const changeBorrowedAmount = useLoanChangeBorrowedAmount();
  const changeBadDebt = useLoanChangeBadDebt();
  const changeTotalSupply = useLoanChangeTotalSupply();

  const transactions = useAllTransactions();

  const fetchLoanInfo = React.useCallback(
    (account: string) => {
      if (account) {
        Promise.all([
          bnJs.Loans.getAvailableAssets(),
          bnJs.bnUSD.totalSupply(),
          bnJs.Loans.getAccountPositions(account),
        ]).then(([resultGetAvailableAssets, resultTotalSupply, resultDebt]: Array<any>) => {
          const bnUSDbadDebt = BalancedJs.utils.toIcx(resultGetAvailableAssets['bnUSD']['bad_debt']);
          const bnUSDTotalSupply = BalancedJs.utils.toIcx(resultTotalSupply);

          const bnUSDDebt = resultDebt['assets']
            ? BalancedJs.utils.toIcx(new BigNumber(parseInt(resultDebt['assets']['bnUSD'] || 0, 16)))
            : new BigNumber(0);

          changeBadDebt(bnUSDbadDebt);
          changeTotalSupply(bnUSDTotalSupply);
          changeBorrowedAmount(bnUSDDebt);
        });
      }
    },
    [changeBadDebt, changeTotalSupply, changeBorrowedAmount],
  );

  React.useEffect(() => {
    if (account) {
      fetchLoanInfo(account);
    }
  }, [fetchLoanInfo, account, transactions]);
}

export function useLoanState() {
  const state = useSelector((state: AppState) => state.loan.state);
  return state;
}

export function useLoanActionHandlers() {
  const dispatch = useDispatch();

  const onFieldAInput = React.useCallback(
    (value: string) => {
      dispatch(type({ independentField: Field.LEFT, typedValue: value, inputType: 'text' }));
    },
    [dispatch],
  );

  const onFieldBInput = React.useCallback(
    (value: string) => {
      dispatch(type({ independentField: Field.RIGHT, typedValue: value, inputType: 'text' }));
    },
    [dispatch],
  );

  const onSlide = React.useCallback(
    (values: string[], handle: number) => {
      dispatch(type({ typedValue: values[handle], inputType: 'slider' }));
    },
    [dispatch],
  );

  const onAdjust = React.useCallback(
    isAdjust => {
      if (isAdjust) {
        dispatch(adjust());
      } else {
        dispatch(cancel());
      }
    },
    [dispatch],
  );

  return {
    onFieldAInput,
    onFieldBInput,
    onSlide,
    onAdjust,
  };
}

export function useLoanTotalBorrowableAmount() {
  const ratio = useRatio();

  const stakedICXAmount = useCollateralInputAmount();

  return stakedICXAmount.multipliedBy(ratio.ICXUSDratio).div(MANDATORY_COLLATERAL_RATIO);
}

export function useLoanInputAmount() {
  const { independentField, typedValue } = useLoanState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const totalBorrowableAmount = useLoanTotalBorrowableAmount();

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalBorrowableAmount.minus(new BigNumber(typedValue || '0')),
  };

  return parsedAmount[Field.LEFT];
}

export function useLockedICXAmount() {
  const ratio = useRatio();

  const bnUSDLoanAmount = useLoanInputAmount();

  return React.useMemo(() => {
    const price = ratio.ICXUSDratio.isZero() ? new BigNumber(1) : ratio.ICXUSDratio;
    return bnUSDLoanAmount.multipliedBy(MANDATORY_COLLATERAL_RATIO).div(price);
  }, [bnUSDLoanAmount, ratio.ICXUSDratio]);
}

export function useLoanDebtHoldingShare() {
  const loanInputAmount = useLoanInputAmount();
  const loanBadDebt = useLoanBadDebt();
  const loanTotalSupply = useLoanTotalSupply();

  return React.useMemo(() => {
    return loanInputAmount.div(loanTotalSupply.minus(loanBadDebt)).multipliedBy(100);
  }, [loanInputAmount, loanBadDebt, loanTotalSupply]);
}
