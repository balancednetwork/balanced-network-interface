import React from 'react';

import axios from 'axios';
import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { MANDATORY_COLLATERAL_RATIO, ZERO } from 'constants/index';
import { useCollateralInputAmount } from 'store/collateral/hooks';
import { useAPYs } from 'store/pool/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';

import { AppState } from '..';
import {
  changeBorrowedAmount,
  changeBadDebt,
  changeTotalSupply,
  changeTotalRepaid,
  Field,
  adjust,
  cancel,
  type,
} from './actions';

export function useLoanBorrowedAmount(): AppState['loan']['borrowedAmount'] {
  return useSelector((state: AppState) => state.loan.borrowedAmount);
}

export function useLoanBadDebt(): AppState['loan']['badDebt'] {
  return useSelector((state: AppState) => state.loan.badDebt);
}

export function useLoanTotalSupply(): AppState['loan']['totalSupply'] {
  return useSelector((state: AppState) => state.loan.totalSupply);
}

export function useLoanTotalRepaid(): AppState['loan']['totalRepaid'] {
  return useSelector((state: AppState) => state.loan.totalRepaid);
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

export function useLoanChangeTotalRepaid(): (totalRepaid: BigNumber) => void {
  const dispatch = useDispatch();
  return React.useCallback(
    (totalRepaid: BigNumber) => {
      dispatch(changeTotalRepaid({ totalRepaid }));
    },
    [dispatch],
  );
}

export function useLoanFetchTotalRepaid(): (interval?: string | null) => void {
  const { account } = useIconReact();
  const dispatch = useDispatch();
  return React.useCallback(
    interval => {
      if (interval) {
        if (interval?.toLowerCase() === 'day') {
          interval = 'yesterday';
        } else if (interval?.toLowerCase() === 'week') {
          interval = 'last-week';
        } else {
          interval = 'last-month';
        }
        try {
          axios
            .get(
              `https://balanced.techiast.com:8069/api/v1/asset-redeemed-sum?address=${account}&symbol=bnUSD&date-preset=${interval}`,
            )
            .then(res => {
              const value = res.data['asset_redeemed_sum'];
              dispatch(changeTotalRepaid({ totalRepaid: BalancedJs.utils.toIcx(new BigNumber(value)) }));
            });
        } catch (e) {
          console.error(e);
        }
      } else {
        dispatch(cancel());
      }
    },
    [dispatch, account],
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

export function useLoanUsedAmount(): BigNumber {
  const remainingAmount = useWalletBalances()['bnUSD'];
  const borrowedAmount = useLoanBorrowedAmount();

  return React.useMemo(() => {
    return borrowedAmount.isGreaterThan(remainingAmount) ? borrowedAmount.minus(remainingAmount).plus(0.1) : ZERO;
  }, [borrowedAmount, remainingAmount]);
}

export function useLoanAPY(): BigNumber {
  const apys = useAPYs();
  return apys['Loans'] || ZERO;
}
