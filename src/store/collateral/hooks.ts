import React, { useMemo } from 'react';

import BigNumber from 'bignumber.js';
import { useQuery, UseQueryResult } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { MINIMUM_ICX_FOR_ACTION } from 'constants/index';
import { NULL_CONTRACT_ADDRESS, SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useBorrowedAmounts, useLockingRatio } from 'store/loan/hooks';
import { useOraclePrices } from 'store/oracle/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { CurrencyKey, IcxDisplayType } from 'types';
import { formatUnits, toBigNumber } from 'utils';

import { AppState } from '../index';
import {
  adjust,
  cancel,
  changeDepositedAmount,
  changeCollateralType,
  changeIcxDisplayType,
  type,
  Field,
} from './actions';

export const DEFAULT_COLLATERAL_TOKEN = 'sICX';

export function useCollateralChangeDepositedAmount(): (depositedAmount: BigNumber, token?: string) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (depositedAmount: BigNumber, token: string = DEFAULT_COLLATERAL_TOKEN) => {
      dispatch(changeDepositedAmount({ depositedAmount, token }));
    },
    [dispatch],
  );
}

export function useCollateralChangeCollateralType(): (collateralType: CurrencyKey) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (collateralType: CurrencyKey) => {
      dispatch(changeCollateralType({ collateralType }));
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

export function useCollateralType() {
  return useSelector((state: AppState) => state.collateral.collateralType);
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

export function useCollateralAmounts(): { [key in string]: BigNumber } {
  return useSelector((state: AppState) => state.collateral.depositedAmounts);
}

export function useCollateralFetchInfo(account?: string | null) {
  const changeDepositedAmount = useCollateralChangeDepositedAmount();
  const transactions = useAllTransactions();

  const fetchCollateralInfo = React.useCallback(
    async (account: string) => {
      const res = await bnJs.Loans.getAccountPositions(account);

      res.holdings &&
        Object.keys(res.holdings).forEach(token => {
          const depositedAmount = new BigNumber(formatUnits(res.holdings[token][token] || 0, 18, 4));
          changeDepositedAmount(depositedAmount, token);
        });
    },
    [changeDepositedAmount],
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
      const value = values[handle];
      dispatch(type({ independentField: Field.LEFT, typedValue: value, inputType: 'slider' }));
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

export function useCollateralDepositedAmount() {
  const depositedAmounts = useCollateralAmounts();
  const collateralType = useCollateralType();
  return depositedAmounts[collateralType] || new BigNumber(0);
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

export function useCollateralTotalAmount() {
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
  const collateralTotal = useTotalCollateral() || new BigNumber(0);

  const roundedTypedValue = Math.round(new BigNumber(typedValue || '0').times(100).toNumber()) / 100;

  const currentAmount = collateralTotal.minus(new BigNumber(roundedTypedValue));

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(roundedTypedValue),
    [dependentField]: currentAmount,
  };

  return parsedAmount[Field.LEFT];
}

export function useCollateralInputAmountAbsolute() {
  const collateralInputAmount = useCollateralInputAmount();
  const isHandlingICX = useIsHandlingICX();
  const ratio = useRatio();

  return useMemo(() => {
    if (ratio) {
      return isHandlingICX ? collateralInputAmount.div(ratio.sICXICXratio) : collateralInputAmount;
    }
  }, [ratio, isHandlingICX, collateralInputAmount]);
}

export function useCollateralInputAmountInSICX() {
  const { independentField, typedValue } = useCollateralState();
  const dependentField: Field = independentField === Field.LEFT ? Field.RIGHT : Field.LEFT;

  const totalSICXAmount = useCollateralTotalAmount();

  //  calculate dependentField value
  const parsedAmount = {
    [independentField]: new BigNumber(typedValue || '0'),
    [dependentField]: totalSICXAmount.minus(new BigNumber(typedValue || '0')),
  };

  return parsedAmount[Field.LEFT];
}

export function useCollateralInputAmountInUSD() {
  const collateralInputAmount = useCollateralInputAmountAbsolute();
  const oraclePrices = useOraclePrices();
  const collateralType = useCollateralType();

  return React.useMemo(() => {
    if (oraclePrices && collateralInputAmount && oraclePrices[collateralType])
      return collateralInputAmount.multipliedBy(oraclePrices[collateralType]);
  }, [collateralInputAmount, oraclePrices, collateralType]);
}

type CollateralInfo = {
  symbol: string;
  name: string;
  displayName?: string;
  collateralDeposit: BigNumber;
  collateralAvailable: BigNumber;
  loanTaken: BigNumber;
  loanAvailable: BigNumber;
};

export function useAllCollateralData(): CollateralInfo[] | undefined {
  const { data: collateralTokens } = useSupportedCollateralTokens();
  const depositedAmounts = useCollateralAmounts();
  const borrowedAmounts = useBorrowedAmounts();
  const lockingRatio = useLockingRatio();
  const oraclePrices = useOraclePrices();
  const balances = useWalletBalances();

  return useMemo(() => {
    const allCollateralInfo: CollateralInfo[] | undefined =
      collateralTokens &&
      Object.values(collateralTokens).map(address => {
        const token = SUPPORTED_TOKENS_MAP_BY_ADDRESS[address];

        const collateralDepositUSDValue =
          depositedAmounts && oraclePrices && depositedAmounts[token.symbol!]
            ? depositedAmounts[token.symbol!].times(oraclePrices[token.symbol!])
            : new BigNumber(0);

        const availableCollateral =
          token.symbol === 'sICX'
            ? toBigNumber(balances[address])
                .plus(toBigNumber(balances[NULL_CONTRACT_ADDRESS]))
                .multipliedBy(oraclePrices[token.symbol!])
            : toBigNumber(balances[address]).multipliedBy(oraclePrices[token.symbol!]);

        const loanTaken =
          borrowedAmounts && borrowedAmounts[token.symbol!] ? borrowedAmounts[token.symbol!] : new BigNumber(0);

        const loanAvailable =
          lockingRatio && availableCollateral ? availableCollateral.div(lockingRatio) : new BigNumber(0);

        return {
          symbol: token.symbol!,
          name: token.name!,
          displayName: token.symbol === 'sICX' ? 'ICX / sICX' : '',
          collateralDeposit: collateralDepositUSDValue,
          collateralAvailable: availableCollateral,
          loanTaken: loanTaken,
          loanAvailable: loanAvailable,
        };
      });
    return allCollateralInfo;
  }, [collateralTokens, depositedAmounts, borrowedAmounts, oraclePrices, balances, lockingRatio]);
}

export function useSupportedCollateralTokens(): UseQueryResult<{ [key in string]: string }> {
  return useQuery('getCollateralTokens', async () => {
    const data = await bnJs.Loans.getCollateralTokens();
    return data;
  });
}

export function useDepositedCollateral() {
  const collateralType = useCollateralType();
  const icxDisplayType = useIcxDisplayType();
  const collateralAmounts = useCollateralAmounts();
  const ratio = useRatio();

  return useMemo(() => {
    if (collateralAmounts[collateralType]) {
      if (collateralType !== 'sICX') {
        return collateralAmounts[collateralType];
      } else {
        return icxDisplayType === 'sICX'
          ? collateralAmounts[collateralType]
          : collateralAmounts[collateralType] && ratio && collateralAmounts[collateralType].times(ratio.sICXICXratio);
      }
    } else {
      return new BigNumber(0);
    }
  }, [collateralType, collateralAmounts, ratio, icxDisplayType]);
}

export function useAvailableCollateral() {
  const collateralType = useCollateralType();
  const { data: supportedCollateralTokens } = useSupportedCollateralTokens();
  const icxDisplayType = useIcxDisplayType();
  const balances = useWalletBalances();
  const shouldGetIcx = collateralType === 'sICX' && icxDisplayType === 'ICX';
  const icxAddress = bnJs.ICX.address;
  const amount = useMemo(
    () =>
      toBigNumber(
        supportedCollateralTokens && balances[shouldGetIcx ? icxAddress : supportedCollateralTokens[collateralType]],
      ),
    [balances, shouldGetIcx, icxAddress, supportedCollateralTokens, collateralType],
  );

  return useMemo(() => {
    return shouldGetIcx ? BigNumber.max(amount.minus(MINIMUM_ICX_FOR_ACTION), new BigNumber(0)) : amount;
  }, [shouldGetIcx, amount]);
}

export function useTotalCollateral() {
  const availableCollateral = useAvailableCollateral();
  const depositedCollateral = useDepositedCollateral();

  return useMemo(() => {
    return availableCollateral.plus(depositedCollateral);
  }, [availableCollateral, depositedCollateral]);
}

export function useIsHandlingICX() {
  const collateralType = useCollateralType();
  const icxDisplayType = useIcxDisplayType();

  return collateralType === 'sICX' && icxDisplayType === 'ICX';
}
