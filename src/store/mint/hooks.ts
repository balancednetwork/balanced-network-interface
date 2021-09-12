import React, { useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import { isQueue, Pair } from 'constants/currency';
import { MINIMUM_ICX_AMOUNT_IN_WALLET, ONE } from 'constants/index';
import { usePool, usePoolPair } from 'store/pool/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { Pool } from 'types';

import { AppDispatch, AppState } from '../index';
import { Field, typeInput } from './actions';

export function useMintState(): AppState['mint'] {
  return useSelector<AppState, AppState['mint']>(state => state.mint);
}

export function useMintActionHandlers(
  noLiquidity: boolean | undefined,
): {
  onFieldAInput: (typedValue: string) => void;
  onFieldBInput: (typedValue: string) => void;
  onSlide: (field: Field, typedValue: string) => void;
} {
  const dispatch = useDispatch<AppDispatch>();

  const onFieldAInput = useCallback(
    (typedValue: string) => {
      dispatch(
        typeInput({ field: Field.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true, inputType: 'text' }),
      );
    },
    [dispatch, noLiquidity],
  );

  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(
        typeInput({ field: Field.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true, inputType: 'text' }),
      );
    },
    [dispatch, noLiquidity],
  );

  const onSlide = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue, noLiquidity: noLiquidity === true, inputType: 'slider' }));
    },
    [dispatch, noLiquidity],
  );

  return {
    onFieldAInput,
    onFieldBInput,
    onSlide,
  };
}

const useSelectedPairRatio = () => {
  const selectedPair = usePoolPair();
  const pool = usePool(selectedPair.poolId);
  if (isQueue(selectedPair)) return ONE;
  return pool?.rate || ONE;
};

export function useDerivedMintInfo(): {
  pair: Pair;
  pool?: Pool;
  dependentField: Field; //
  noLiquidity?: boolean;
  currencyBalances: { [field in Field]: BigNumber };
  parsedAmounts: { [field in Field]: BigNumber };
  error?: string;
} {
  const { independentField, typedValue, otherTypedValue } = useMintState();

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;

  // check liquidity
  const pair = usePoolPair();
  const pool = usePool(pair.poolId);
  const noLiquidity = pool?.total.isZero() ? true : false;

  // balances
  const balances = useWalletBalances();
  const currencyBalances = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: balances[pair.baseCurrencyKey],
      [Field.CURRENCY_B]: balances[pair.quoteCurrencyKey],
    }),
    [pair, balances],
  );

  // price
  const price = useSelectedPairRatio();

  // amounts
  const independentAmount = React.useMemo(() => new BigNumber(typedValue || 0), [typedValue]);
  const dependentAmount: BigNumber = React.useMemo(() => {
    if (noLiquidity) {
      return new BigNumber(otherTypedValue || 0);
    } else {
      if (independentField === Field.CURRENCY_A) {
        return independentAmount.times(price);
      } else {
        return independentAmount.div(price);
      }
    }
  }, [independentAmount, otherTypedValue, price, noLiquidity, independentField]);
  const parsedAmounts: { [field in Field]: BigNumber } = {
    [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
    [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
  };

  //
  const { account } = useIconReact();

  let error: string | undefined;
  if (!account) {
    error = 'Connect Wallet';
  }

  if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? 'Enter an amount';
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts;

  if (pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
    if (currencyBalances?.[Field.CURRENCY_B].isZero()) {
      error = error ?? 'Insufficient balance';
    }

    if (
      currencyBAmount &&
      currencyBalances?.[Field.CURRENCY_B]?.isLessThan(currencyBAmount.plus(MINIMUM_ICX_AMOUNT_IN_WALLET))
    ) {
      error = error ?? 'Insufficient balance';
    }
  } else {
    if (currencyBalances?.[Field.CURRENCY_A].isZero() || currencyBalances?.[Field.CURRENCY_B].isZero()) {
      error = error ?? 'Insufficient balance';
    }

    if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.isLessThan(currencyAAmount)) {
      error = error ?? 'Insufficient balance';
    }

    if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.isLessThan(currencyBAmount)) {
      error = error ?? 'Insufficient balance';
    }
  }

  return {
    pair,
    pool,
    dependentField,
    noLiquidity,
    currencyBalances,
    parsedAmounts,
    error,
  };
}
