import React, { useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import { SUPPORTED_PAIRS } from 'constants/currency';
import { usePoolPair } from 'store/pool/hooks';
import { useRatio } from 'store/ratio/hooks';
import { useWalletBalances } from 'store/wallet/hooks';

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
} {
  const dispatch = useDispatch<AppDispatch>();

  const onFieldAInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_A, typedValue, noLiquidity: noLiquidity === true }));
    },
    [dispatch, noLiquidity],
  );

  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(typeInput({ field: Field.CURRENCY_B, typedValue, noLiquidity: noLiquidity === true }));
    },
    [dispatch, noLiquidity],
  );

  return {
    onFieldAInput,
    onFieldBInput,
  };
}

const useSelectedPairBalances = () => {
  const selectedPair = usePoolPair();
  const walletBalance = useWalletBalances();

  switch (selectedPair.pair) {
    case SUPPORTED_PAIRS[0].pair: {
      return {
        [Field.CURRENCY_A]: walletBalance.sICXbalance,
        [Field.CURRENCY_B]: walletBalance.bnUSDbalance,
      };
    }

    case SUPPORTED_PAIRS[1].pair: {
      return {
        [Field.CURRENCY_A]: walletBalance.BALNbalance,
        [Field.CURRENCY_B]: walletBalance.bnUSDbalance,
      };
    }

    case SUPPORTED_PAIRS[2].pair: {
      return { [Field.CURRENCY_A]: walletBalance.ICXbalance, [Field.CURRENCY_B]: new BigNumber(0) };
    }

    default: {
      return { [Field.CURRENCY_A]: new BigNumber(0), [Field.CURRENCY_B]: new BigNumber(0) };
    }
  }
};

const useSelectedPairRatio = () => {
  const ratio = useRatio();
  const selectedPair = usePoolPair();

  switch (selectedPair.pair) {
    case SUPPORTED_PAIRS[0].pair: {
      return ratio.sICXbnUSDratio;
    }
    case SUPPORTED_PAIRS[1].pair: {
      return ratio.BALNbnUSDratio;
    }
    case SUPPORTED_PAIRS[2].pair: {
      return ratio.sICXICXratio;
    }
  }
  return new BigNumber(1);
};

export function useDerivedMintInfo(): {
  dependentField: Field; //
  noLiquidity?: boolean;
  currencyBalances: { [field in Field]: BigNumber };
  parsedAmounts: { [field in Field]: BigNumber };
} {
  // const selectedPair = usePoolPair();

  const { independentField, typedValue, otherTypedValue } = useMintState();

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;

  //
  const noLiquidity = false;

  // balances
  const currencyBalances = useSelectedPairBalances();

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

  return {
    dependentField,
    noLiquidity,
    currencyBalances,
    parsedAmounts,
  };
}
