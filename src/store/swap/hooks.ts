import React, { useCallback } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import { getTradePair } from 'constants/currency';
import { ZERO } from 'constants/index';
import { useSwapSlippageTolerance } from 'store/application/hooks';
import { usePools } from 'store/pool/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { Pool, CurrencyAmount, Price, CurrencyKey, Trade } from 'types';
import { InsufficientInputAmountError, InsufficientReservesError } from 'types/index';

import { AppDispatch, AppState } from '../index';
import { Field, selectCurrency, selectPercent, setRecipient, switchCurrencies, typeInput } from './actions';

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap);
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currencyId: CurrencyKey) => void;
  onPercentSelection: (field: Field, percent: number) => void;
  onSwitchTokens: () => void;
  onUserInput: (field: Field, typedValue: string) => void;
  onChangeRecipient: (recipient: string | null) => void;
} {
  const dispatch = useDispatch<AppDispatch>();
  const onCurrencySelection = useCallback(
    (field: Field, currencyId: CurrencyKey) => {
      dispatch(
        selectCurrency({
          field,
          currencyId: currencyId,
        }),
      );
    },
    [dispatch],
  );

  const onPercentSelection = useCallback(
    (field: Field, percent: number) => {
      dispatch(selectPercent({ field, percent }));
    },
    [dispatch],
  );

  const onSwitchTokens = useCallback(() => {
    dispatch(switchCurrencies());
  }, [dispatch]);

  const onUserInput = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue }));
    },
    [dispatch],
  );

  const onChangeRecipient = useCallback(
    (recipient: string | null) => {
      dispatch(setRecipient({ recipient }));
    },
    [dispatch],
  );

  return {
    onSwitchTokens,
    onCurrencySelection,
    onUserInput,
    onChangeRecipient,
    onPercentSelection,
  };
}

function useCurrencyBalances(
  account: string | undefined,
  currencyKeys: [CurrencyKey | undefined, CurrencyKey | undefined],
): (CurrencyAmount | undefined)[] {
  const balances = useWalletBalances();

  return React.useMemo(
    () =>
      currencyKeys.map(currencyKey => {
        if (!account || !currencyKey) return undefined;
        return new CurrencyAmount(currencyKey, balances[currencyKey]);
      }),
    [balances, account, currencyKeys],
  );
}

const _997 = new BigNumber(997);
const _1000 = new BigNumber(1000);

function getOutputAmount(inputAmount: CurrencyAmount, pool: Pool): CurrencyAmount {
  if (pool.base.isZero() || pool.quote.isZero()) {
    throw new InsufficientReservesError();
  }
  const inputReserve = inputAmount.currencyKey === pool.baseCurrencyKey ? pool.base : pool.quote;
  const outputReserve = inputAmount.currencyKey === pool.baseCurrencyKey ? pool.quote : pool.base;
  const inputAmountWithFee = inputAmount.amount.times(_997);
  const numerator = inputAmountWithFee.times(outputReserve);
  const denominator = inputReserve.times(_1000).plus(inputAmountWithFee);
  const outputAmount = new CurrencyAmount(
    inputAmount.currencyKey === pool.baseCurrencyKey ? pool.quoteCurrencyKey : pool.baseCurrencyKey,
    numerator.div(denominator),
  );
  if (outputAmount.amount.isZero()) {
    throw new InsufficientInputAmountError();
  }
  return outputAmount;
}

function getOutputAmount1(inputAmount: CurrencyAmount, pool: Pool): CurrencyAmount {
  if (pool.base.isZero() || pool.quote.isZero()) {
    throw new InsufficientReservesError();
  }

  let outputAmount: CurrencyAmount;
  if (inputAmount.currencyKey === pool.baseCurrencyKey) {
    //unstaking sICX -> ICX fee: 1%
    outputAmount = new CurrencyAmount(pool.quoteCurrencyKey, inputAmount.amount.times(pool.rate).times(99).div(100));
  } else {
    //staking ICX -> sICX fee: 0%
    outputAmount = new CurrencyAmount(pool.baseCurrencyKey, inputAmount.amount.times(pool.inverseRate));
  }
  if (outputAmount.amount.isZero()) {
    throw new InsufficientInputAmountError();
  }
  return outputAmount;
}

function getInputAmount(outputAmount: CurrencyAmount, pool: Pool): CurrencyAmount {
  // invariant(this.involvesToken(outputAmount.token), 'TOKEN');

  const outputReserve = outputAmount.currencyKey === pool.baseCurrencyKey ? pool.base : pool.quote;
  const inputReserve = outputAmount.currencyKey === pool.baseCurrencyKey ? pool.quote : pool.base;
  if (pool.base.isZero() || pool.quote.isZero() || outputAmount.amount.isGreaterThan(outputReserve)) {
    throw new InsufficientReservesError();
  }

  const numerator = inputReserve.times(outputAmount.amount).times(_1000);
  const denominator = outputReserve.minus(outputAmount.amount).times(_997);
  const inputAmount = new CurrencyAmount(
    outputAmount.currencyKey === pool.baseCurrencyKey ? pool.quoteCurrencyKey : pool.baseCurrencyKey,
    numerator.div(denominator),
  );
  return inputAmount;
}

function getInputAmount1(outputAmount: CurrencyAmount, pool: Pool): CurrencyAmount {
  if (pool.base.isZero() || pool.quote.isZero()) {
    throw new InsufficientReservesError();
  }

  let inputAmount: CurrencyAmount;
  if (outputAmount.currencyKey === pool.quoteCurrencyKey) {
    //unstaking sICX -> ICX fee: 1%
    inputAmount = new CurrencyAmount(pool.baseCurrencyKey, outputAmount.amount.div(pool.rate).times(100).div(99));
  } else {
    //staking ICX -> sICX fee: 0%
    inputAmount = new CurrencyAmount(pool.quoteCurrencyKey, outputAmount.amount.times(pool.rate));
  }
  return inputAmount;
}

export function useTradeExactIn(currencyAmountIn?: CurrencyAmount, currencyOut?: CurrencyKey) {
  const pools = usePools();
  if (!currencyAmountIn || !currencyOut) return undefined;

  const [pair] = getTradePair(currencyAmountIn.currencyKey, currencyOut);

  if (!pair) return undefined;

  const pool = pools[pair.poolId];

  if (!pool) return undefined;

  let currencyAmountOut: CurrencyAmount;
  if (pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
    // sICX/ICX queue
    try {
      currencyAmountOut = getOutputAmount1(currencyAmountIn, pool);
    } catch (e) {
      return undefined;
    }
  } else {
    try {
      currencyAmountOut = getOutputAmount(currencyAmountIn, pool);
    } catch (e) {
      return undefined;
    }
  }

  return new Trade(currencyAmountIn, currencyAmountOut, pool);
}

export function useTradeExactOut(currencyIn?: CurrencyKey, currencyAmountOut?: CurrencyAmount) {
  const pools = usePools();
  if (!currencyIn || !currencyAmountOut) return undefined;

  const [pair] = getTradePair(currencyIn, currencyAmountOut.currencyKey);

  if (!pair) return undefined;

  const pool = pools[pair.poolId];

  if (!pool) return undefined;

  let currencyAmountIn: CurrencyAmount;
  if (pair.poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
    // sICX/ICX queue
    currencyAmountIn = getInputAmount1(currencyAmountOut, pool);
  } else {
    try {
      currencyAmountIn = getInputAmount(currencyAmountOut, pool);
    } catch (e) {
      return undefined;
    }
  }

  return new Trade(currencyAmountIn, currencyAmountOut, pool);
}

export function usePrice(currencyIn?: CurrencyKey, currencyOut?: CurrencyKey): Price | undefined {
  const pools = usePools();

  if (!currencyIn || !currencyOut) return undefined;

  const [pair, inverse] = getTradePair(currencyIn, currencyOut);

  if (!pair) return undefined;

  const pool = pools[pair.poolId];

  if (!pool) return undefined;

  return !inverse
    ? new Price(currencyIn, currencyOut, pool.rate)
    : new Price(currencyIn, currencyOut, pool.inverseRate);
}

// try to parse a user entered amount for a given token
export function tryParseAmount(value?: string, currencyKey?: CurrencyKey): CurrencyAmount | undefined {
  if (!value || !currencyKey) {
    return undefined;
  }
  return new CurrencyAmount(currencyKey, new BigNumber(value));
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  trade: Trade | undefined;
  currencyKeys: { [field in Field]?: CurrencyKey };
  percents: { [field in Field]?: number };
  currencyBalances: { [field in Field]?: CurrencyAmount | undefined };
  price: Price | undefined;
  parsedAmount: CurrencyAmount | undefined;
  inputError?: string;
  allowedSlippage: number;
} {
  const { account } = useIconReact();

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currencyId: inputCurrencyId, percent: inputPercent },
    [Field.OUTPUT]: { currencyId: outputCurrencyId, percent: outputPercent },
  } = useSwapState();

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrencyId ?? undefined,
    outputCurrencyId ?? undefined,
  ]);

  const isExactIn: boolean = independentField === Field.INPUT;
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrencyId : outputCurrencyId) ?? undefined);

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  };

  const currencyKeys: { [field in Field]?: CurrencyKey } = React.useMemo(
    () => ({
      [Field.INPUT]: inputCurrencyId,
      [Field.OUTPUT]: outputCurrencyId,
    }),
    [inputCurrencyId, outputCurrencyId],
  );
  const percents: { [field in Field]?: number } = React.useMemo(
    () => ({
      [Field.INPUT]: inputPercent,
      [Field.OUTPUT]: outputPercent,
    }),
    [inputPercent, outputPercent],
  );
  const price = usePrice(inputCurrencyId, outputCurrencyId);
  //
  const trade1 = useTradeExactIn(isExactIn ? parsedAmount : undefined, outputCurrencyId);
  const trade2 = useTradeExactOut(inputCurrencyId, !isExactIn ? parsedAmount : undefined);
  const trade = isExactIn ? trade1 : trade2;

  let inputError: string | undefined;
  if (!account) {
    inputError = 'Connect Wallet';
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter amount';
  }

  if (!currencyKeys[Field.INPUT] || !currencyKeys[Field.OUTPUT]) {
    inputError = inputError ?? 'Select a token';
  }

  const allowedSlippage = useSwapSlippageTolerance();

  // compare input balance to max input based on version

  const minimumToReceive: BigNumber | undefined = isExactIn
    ? trade?.inputAmount.amount
    : trade?.inputAmount.amount.times(10_000 - allowedSlippage).div(10_000);

  const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], minimumToReceive];

  if (balanceIn && amountIn && balanceIn.amount.isLessThan(amountIn)) {
    inputError = 'Insufficient ' + currencyKeys[Field.INPUT];
  }

  //
  const userHasSpecifiedInputOutput = Boolean(
    currencyKeys[Field.INPUT] && currencyKeys[Field.OUTPUT] && parsedAmount?.raw.isGreaterThan(ZERO),
  );

  if (userHasSpecifiedInputOutput && !trade) inputError = 'Insufficient liquidity';

  return {
    trade,
    currencyKeys,
    currencyBalances,
    parsedAmount,
    price,
    inputError,
    allowedSlippage,
    percents,
  };
}
