import React from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { MINIMUM_ICX_FOR_ACTION } from 'constants/index';
import { useRatio } from 'store/ratio/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { IcxDisplayType } from 'types';
import { toBigNumber } from 'utils';

import { AppState } from '../index';
import { adjust, cancel, changeDepositedAmount, changeIcxDisplayType, type, Field } from './actions';

export function useCollateralChangeDepositedAmount(): (depositedAmount: BigNumber) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (depositedAmount: BigNumber) => {
      dispatch(changeDepositedAmount({ depositedAmount }));
    },
    [dispatch],
  );
}

export function useCollateralChangeIcxDisplayType(): (icxDisplayType: IcxDisplayType) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (icxDisplayType: IcxDisplayType) => {
      dispatch(changeIcxDisplayType({ icxDisplayType }));
    },
    [dispatch],
  );
}

export function useIcxDisplayType() {
  return useSelector((state: AppState) => state.collateral.icxDisplayType);
}

export function useCollateralAvailableAmount() {
  const icxAddress = bnJs.ICX.address;
  const balances = useWalletBalances();
  const ICXAmountCA = balances[icxAddress];
  const ICXAmount = toBigNumber(ICXAmountCA);

  return React.useMemo(() => {
    return BigNumber.max(ICXAmount.minus(MINIMUM_ICX_FOR_ACTION), new BigNumber(0));
  }, [ICXAmount]);
}

export function useCollateralAvailableAmountinSICX() {
  const sicxAddress = bnJs.sICX.address;
  const balances = useWalletBalances();
  const sICXAmountCA = balances[sicxAddress];
  const sICXAmount = toBigNumber(sICXAmountCA);

  return sICXAmount;
}

export function useCollateralFetchInfo(account?: string | null) {
  const changeStakedICXAmount = useCollateralChangeDepositedAmount();
  const transactions = useAllTransactions();

  const fetchCollateralInfo = React.useCallback(
    async (account: string) => {
      const res = await bnJs.Loans.getAccountPositions(account);
      const depositedsICX =
        res['assets'] && res['assets']['sICX'] ? BalancedJs.utils.toIcx(res['assets']['sICX']) : new BigNumber(0);

      changeStakedICXAmount(depositedsICX);
    },
    [changeStakedICXAmount],
  );

  React.useEffect(() => {
    if (account) {
      fetchCollateralInfo(account);
    }
  }, [fetchCollateralInfo, account, transactions]);
}

export function useCollateralState() {
  return useSelector((state: AppState) => state.collateral.state);
}

export function useCollateralActionHandlers() {
  const dispatch = useDispatch();
  const icxDisplayType = useIcxDisplayType();
  const ratio = useRatio();

  const onFieldAInput = React.useCallback(
    (value: string) => {
      value = icxDisplayType === 'ICX' ? value : new BigNumber(value).times(ratio.sICXICXratio).toString();
      dispatch(type({ independentField: Field.LEFT, typedValue: value, inputType: 'text' }));
    },
    [dispatch, icxDisplayType, ratio.sICXICXratio],
  );

  const onFieldBInput = React.useCallback(
    (value: string) => {
      value = icxDisplayType === 'ICX' ? value : new BigNumber(value).times(ratio.sICXICXratio).toString();

      dispatch(type({ independentField: Field.RIGHT, typedValue: value, inputType: 'text' }));
    },
    [dispatch, icxDisplayType, ratio.sICXICXratio],
  );

  const onSlide = React.useCallback(
    (values: string[], handle: number) => {
      const value =
        icxDisplayType === 'ICX' ? values[handle] : new BigNumber(values[handle]).times(ratio.sICXICXratio).toString();

      dispatch(type({ independentField: Field.LEFT, typedValue: value, inputType: 'slider' }));
    },
    [dispatch, icxDisplayType, ratio.sICXICXratio],
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

export function useCollateralDepositedAmount() {
  return useSelector((state: AppState) => state.collateral.depositedAmount);
}

export function useCollateralDepositedAmountInICX() {
  const sICXAmount = useCollateralDepositedAmount();

  const ratio = useRatio();

  return React.useMemo(() => {
    return sICXAmount.multipliedBy(ratio.sICXICXratio);
  }, [sICXAmount, ratio.sICXICXratio]);
}

export function useCollateralTotalICXAmount() {
  const ICXAmount = useCollateralAvailableAmount();

  const stakedICXAmount = useCollateralDepositedAmountInICX();

  return React.useMemo(() => {
    const totalICXAmount = stakedICXAmount.plus(ICXAmount);
    return totalICXAmount;
  }, [stakedICXAmount, ICXAmount]);
}

export function useCollateralTotalSICXAmount() {
  const sICXAmount = useCollateralAvailableAmountinSICX();

  const collateralSICXAmount = useCollateralDepositedAmount();

  return React.useMemo(() => {
    const totalSICXAmount = sICXAmount.plus(collateralSICXAmount);
    return totalSICXAmount;
  }, [sICXAmount, collateralSICXAmount]);
}

export function useCollateralInputAmount() {
  const { independentField, typedValue } = useCollateralState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;
  const icxDisplayType = useIcxDisplayType();
  const ratio = useRatio();

  const totalICXAmount = useCollateralTotalICXAmount();
  const totalSICXAmount = useCollateralTotalSICXAmount();

  const roundedTypedValue = Math.round(new BigNumber(typedValue || '0').times(100).toNumber()) / 100;

  const currentAmount =
    icxDisplayType === 'ICX'
      ? totalICXAmount.minus(new BigNumber(roundedTypedValue))
      : totalSICXAmount.minus(new BigNumber(roundedTypedValue).div(ratio.sICXICXratio)).times(ratio.sICXICXratio);

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(roundedTypedValue),
    [dependentField]: currentAmount,
  };

  return parsedAmount[Field.LEFT];
}

export function useCollateralInputAmountInSICX() {
  const { independentField, typedValue } = useCollateralState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const totalSICXAmount = useCollateralTotalSICXAmount();

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalSICXAmount.minus(new BigNumber(typedValue || '0')),
  };

  return parsedAmount[Field.LEFT];
}

export function useCollateralInputAmountInUSD() {
  const collateralInputAmount = useCollateralInputAmount();
  const ratio = useRatio();

  return React.useMemo(() => {
    return collateralInputAmount.multipliedBy(ratio.ICXUSDratio);
  }, [collateralInputAmount, ratio.ICXUSDratio]);
}
