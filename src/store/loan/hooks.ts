import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { ZERO } from 'constants/index';
import { useBnJsContractQuery } from 'queries/utils';
import { useCollateralInputAmount } from 'store/collateral/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useRewards } from 'store/reward/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { toBigNumber } from 'utils';

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
        ]).then(([resultAvailableAssets, resultTotalSupply, resultDebt]: Array<any>) => {
          const bnUSDbadDebt = resultAvailableAssets['bnUSD']
            ? BalancedJs.utils.toIcx(resultAvailableAssets['bnUSD']['bad_debt'] || '0')
            : new BigNumber(0);
          const bnUSDTotalSupply = BalancedJs.utils.toIcx(resultTotalSupply);

          const bnUSDDebt = resultDebt['assets']
            ? BalancedJs.utils.toIcx(resultDebt['assets']['bnUSD'] || '0')
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
      dispatch(type({ independentField: Field.LEFT, typedValue: values[handle], inputType: 'slider' }));
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
  const loanParameters = useLoanParameters();
  const { lockingRatio } = loanParameters || {};

  if (lockingRatio) return stakedICXAmount.multipliedBy(ratio.ICXUSDratio).div(lockingRatio);
  else return ZERO;
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
  const loanParameters = useLoanParameters();
  const { lockingRatio } = loanParameters || {};

  return React.useMemo(() => {
    const price = ratio.ICXUSDratio.isZero() ? new BigNumber(1) : ratio.ICXUSDratio;
    return bnUSDLoanAmount.multipliedBy(lockingRatio || 0).div(price);
  }, [bnUSDLoanAmount, ratio.ICXUSDratio, lockingRatio]);
}

export function useLockedSICXAmount() {
  const ratio = useRatio();
  const loanParameters = useLoanParameters();
  const { lockingRatio } = loanParameters || {};

  const bnUSDLoanAmount = useLoanInputAmount();

  return React.useMemo(() => {
    const price = ratio.ICXUSDratio.isZero() ? new BigNumber(1) : ratio.ICXUSDratio;
    const sicxIcxRatio = ratio.sICXICXratio.isZero() ? new BigNumber(1) : ratio.sICXICXratio;
    const icxLockedAmount = bnUSDLoanAmount.multipliedBy(lockingRatio || 0).div(price);
    return icxLockedAmount.div(sicxIcxRatio);
  }, [bnUSDLoanAmount, ratio.ICXUSDratio, ratio.sICXICXratio, lockingRatio]);
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
  const bnusdAddress = bnJs.bnUSD.address;
  const balances = useWalletBalances();
  const remainingAmountCA = balances[bnusdAddress];
  const remainingAmount = toBigNumber(remainingAmountCA);
  const borrowedAmount = useLoanBorrowedAmount();

  return React.useMemo(() => {
    return borrowedAmount.isGreaterThan(remainingAmount) ? borrowedAmount.minus(remainingAmount).plus(0.1) : ZERO;
  }, [borrowedAmount, remainingAmount]);
}

export function useLoanTotalbnUSDDebt() {
  const loanBadDebt = useLoanBadDebt();
  const loanTotalSupply = useLoanTotalSupply();

  return React.useMemo(() => {
    return loanTotalSupply.minus(loanBadDebt);
  }, [loanTotalSupply, loanBadDebt]);
}

// calculate loans apy in frontend
// https://github.com/balancednetwork/balanced-network-interface/issues/363
export function useLoanAPY(): BigNumber | undefined {
  const rewards = useRewards();
  const totalLoanDailyRewards = React.useMemo(() => rewards['Loans'] || ZERO, [rewards]);
  const ratio = useRatio();
  const totalbnUSDDebt = useLoanTotalbnUSDDebt();

  return React.useMemo(() => {
    if (totalbnUSDDebt.isGreaterThan(ZERO))
      return totalLoanDailyRewards.times(365).times(ratio.BALNbnUSDratio).div(totalbnUSDDebt);
    else return;
  }, [totalLoanDailyRewards, ratio.BALNbnUSDratio, totalbnUSDDebt]);
}

export function useLoanParameters() {
  const query = useBnJsContractQuery<any>('Loans', 'getParameters', [], false);

  if (query.isSuccess) {
    const data = query.data;

    return {
      lockingRatio: parseInt(data['locking ratio'], 16) / 10_000,
      liquidationRatio: parseInt(data['liquidation ratio'], 16) / 10_000,
      originationFee: parseInt(data['origination fee'], 16) / 10_000,
      redemptionFee: parseInt(data['redemption fee'], 16) / 10_000,
    };
  }
}
