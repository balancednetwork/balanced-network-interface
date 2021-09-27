import React, { useCallback } from 'react';

import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import { MINIMUM_ICX_FOR_ACTION } from 'constants/index';
import { PairInfo } from 'constants/pairs';
import { SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import { usePool, usePoolPair } from 'store/pool/hooks';
import { tryParseAmount, useCurrencyBalances } from 'store/swap/hooks';
import { convertPair } from 'types/adapter';
import { Currency, CurrencyAmount, Token, Percent, Price } from 'types/balanced-sdk-core';
import { Pair } from 'types/balanced-v1-sdk';
import { Pool } from 'types/index';
import { parseUnits } from 'utils';

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

const useCurrencies = (pair: PairInfo) => {
  return React.useMemo(() => {
    const currencyA = SUPPORTED_TOKENS_LIST.find(token => token.symbol === pair.baseCurrencyKey);
    const currencyB = SUPPORTED_TOKENS_LIST.find(token => token.symbol === pair.quoteCurrencyKey);
    return [currencyA, currencyB];
  }, [pair]);
};

export function useTotalSupply(token?: Currency, pool?: Pool): CurrencyAmount<Token> | undefined {
  const totalSupply = pool?.total;

  return React.useMemo(
    () =>
      token?.isToken && totalSupply
        ? CurrencyAmount.fromRawAmount(token, parseUnits(totalSupply.toFixed(), token.decimals))
        : undefined,
    [token, totalSupply],
  );
}

export function useDerivedMintInfo(): {
  dependentField: Field; //
  currencies: { [field in Field]?: Currency };
  pairInfo: PairInfo;
  pair?: Pair | null;
  noLiquidity?: boolean;
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> };
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  price?: Price<Currency, Currency>;
  liquidityMinted?: CurrencyAmount<Token>;
  availableLiquidity?: CurrencyAmount<Token>;
  poolTokenPercentage?: Percent;
  error?: string;
  pool?: Pool;
} {
  const { account } = useIconReact();

  const { independentField, typedValue, otherTypedValue } = useMintState();

  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;

  const pairInfo = usePoolPair();

  const [currencyA, currencyB] = useCurrencies(pairInfo);

  // tokens
  const currencies: { [field in Field]?: Currency } = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined,
    }),
    [currencyA, currencyB],
  );

  // pair
  const pool = usePool(pairInfo.id);
  const pair = React.useMemo(() => convertPair(pool), [pool]);
  const totalSupply = useTotalSupply(pair?.liquidityToken, pool);
  const noLiquidity = pool?.total.isZero() ? true : false;

  // balances
  const currencyArr = React.useMemo(() => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]], [currencies]);
  const balances = useCurrencyBalances(account ?? undefined, currencyArr);
  const currencyBalances: { [field in Field]?: CurrencyAmount<Currency> } = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: balances[0],
      [Field.CURRENCY_B]: balances[1],
    }),
    [balances],
  );

  // amounts
  const independentAmount: CurrencyAmount<Currency> | undefined = tryParseAmount(
    typedValue,
    currencies[independentField],
  );
  const dependentAmount: CurrencyAmount<Currency> | undefined = React.useMemo(() => {
    if (noLiquidity) {
      if (otherTypedValue && currencies[dependentField]) {
        return tryParseAmount(otherTypedValue, currencies[dependentField]);
      }
      return undefined;
    } else if (independentAmount) {
      // we wrap the currencies just to get the price in terms of the other token
      const wrappedIndependentAmount = independentAmount?.wrapped;
      const [tokenA, tokenB] = [currencyA?.wrapped, currencyB?.wrapped];
      if (tokenA && tokenB && wrappedIndependentAmount && pair) {
        const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyB : currencyA;
        const dependentTokenAmount =
          dependentField === Field.CURRENCY_B
            ? pair.priceOf(tokenA).quote(wrappedIndependentAmount)
            : pair.priceOf(tokenB).quote(wrappedIndependentAmount);
        return dependentCurrency?.isNative
          ? CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
          : dependentTokenAmount;
      }
      return undefined;
    } else {
      return undefined;
    }
  }, [noLiquidity, otherTypedValue, currencies, dependentField, independentAmount, currencyA, currencyB, pair]);

  const parsedAmounts: { [field in Field]: CurrencyAmount<Currency> | undefined } = React.useMemo(() => {
    return {
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
      [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
    };
  }, [dependentAmount, independentAmount, independentField]);

  const price = React.useMemo(() => {
    if (noLiquidity) {
      const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts;
      if (currencyAAmount?.greaterThan(0) && currencyBAmount?.greaterThan(0)) {
        const value = currencyBAmount.divide(currencyAAmount);
        return new Price(currencyAAmount.currency, currencyBAmount.currency, value.denominator, value.numerator);
      }
      return undefined;
    } else {
      const wrappedCurrencyA = currencyA?.wrapped;
      return pair && wrappedCurrencyA ? pair.priceOf(wrappedCurrencyA) : undefined;
    }
  }, [currencyA, noLiquidity, pair, parsedAmounts]);

  // liquidity minted
  const liquidityMinted = React.useMemo(() => {
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts;
    const [tokenAmountA, tokenAmountB] = [currencyAAmount?.wrapped, currencyBAmount?.wrapped];
    if (pair && totalSupply && tokenAmountA && tokenAmountB) {
      try {
        return pair.getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB);
      } catch (error) {
        console.error(error);
        return undefined;
      }
    } else {
      return undefined;
    }
  }, [parsedAmounts, pair, totalSupply]);

  // available liquidity minted by balances
  const availableLiquidity = React.useMemo(() => {
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = currencyBalances;
    const [tokenAmountA, tokenAmountB] = [currencyAAmount?.wrapped, currencyBAmount?.wrapped];
    if (pair && totalSupply && tokenAmountA && tokenAmountB) {
      try {
        return pair.getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB);
      } catch (error) {
        console.error(error);
        return undefined;
      }
    } else {
      return undefined;
    }
  }, [currencyBalances, pair, totalSupply]);

  const poolTokenPercentage = React.useMemo(() => {
    if (liquidityMinted && totalSupply) {
      return new Percent(liquidityMinted.quotient, totalSupply.add(liquidityMinted).quotient);
    } else {
      return undefined;
    }
  }, [liquidityMinted, totalSupply]);

  let error: string | undefined;
  if (!account) {
    error = 'Connect Wallet';
  }

  if (!pair) {
    error = error ?? `Invalid pair`;
  }

  if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? 'Enter an amount';
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts;

  if (pairInfo && pairInfo.id === BalancedJs.utils.POOL_IDS.sICXICX) {
    if (
      currencyBAmount &&
      currencyBalances?.[Field.CURRENCY_B]?.lessThan(
        currencyBAmount.add(CurrencyAmount.fromRawAmount(currencyBAmount.currency, MINIMUM_ICX_FOR_ACTION)),
      )
    ) {
      error = error ?? 'Insufficient balance';
    }
  } else {
    if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
      error = `Insufficient ${currencies[Field.CURRENCY_A]?.symbol} balance`;
    }

    if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
      error = `Insufficient ${currencies[Field.CURRENCY_B]?.symbol} balance`;
    }
  }

  return {
    dependentField,
    currencies,
    pairInfo,
    pair,
    noLiquidity,
    currencyBalances,
    parsedAmounts,
    price,
    liquidityMinted,
    availableLiquidity,
    poolTokenPercentage,
    error,
    pool,
  };
}
