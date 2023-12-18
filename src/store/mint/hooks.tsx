import React, { useCallback, ReactNode } from 'react';

import { Currency, CurrencyAmount, Token, Percent, Price } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import { SupportedXCallChains } from 'app/_xcall/types';
import bnJs from 'bnJs';
import { isNativeCurrency, useICX } from 'constants/tokens';
import { useAllTokens, useCommonBases } from 'hooks/Tokens';
import { useQueuePair } from 'hooks/useQueuePair';
import { PairState, useV2Pair } from 'hooks/useV2Pairs';
import { tryParseAmount } from 'store/swap/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useCrossChainCurrencyBalances, useCurrencyBalances } from 'store/wallet/hooks';
import { useCurrentXCallState } from 'store/xCall/hooks';

import { AppDispatch, AppState } from '../index';
import { Field, typeInput, selectCurrency } from './actions';
import { INITIAL_MINT } from './reducer';

export function useMintState(): AppState['mint'] {
  return useSelector<AppState, AppState['mint']>(state => state.mint);
}

export function useMintActionHandlers(
  noLiquidity: boolean | undefined,
): {
  onCurrencySelection: (field: Field, currency: Currency) => void;
  onFieldAInput: (typedValue: string) => void;
  onFieldBInput: (typedValue: string) => void;
  onSlide: (field: Field, typedValue: string) => void;
} {
  const dispatch = useDispatch<AppDispatch>();
  const history = useHistory();
  const { pair = '' } = useParams<{ pair: string }>();

  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currency: currency,
        }),
      );

      if (field === Field.CURRENCY_A) {
        if (currency.symbol === 'ICX') {
          history.replace(`/trade/supply/${currency.symbol}`);
        } else {
          const currentQuote = pair.split('_')[1];
          history.replace(`/trade/supply/${currency.symbol}` + (currentQuote ? `_${currentQuote}` : ''));
        }
      }
      if (field === Field.CURRENCY_B) {
        const currentBase = pair.split('_')[0];
        history.replace(`/trade/supply/${currentBase}_${currency.symbol}`);
      }
    },
    [dispatch, history, pair],
  );

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
    onCurrencySelection,
    onFieldAInput,
    onFieldBInput,
    onSlide,
  };
}

const ZERO = JSBI.BigInt(0);

const useCurrencyDeposit = (
  account: string | undefined | null,
  currency: Currency | undefined,
): CurrencyAmount<Currency> | undefined => {
  const token = currency?.wrapped;
  const transactions = useAllTransactions();
  const [result, setResult] = React.useState<string | undefined>();
  const currentXCallState = useCurrentXCallState();

  React.useEffect(() => {
    (async () => {
      if (token?.address && account) {
        const res = await bnJs.Dex.getDeposit(token?.address || '', account || '');
        setResult(res);
      }
    })();
  }, [transactions, token, account, currentXCallState]);

  return token && result ? CurrencyAmount.fromRawAmount<Currency>(token, JSBI.BigInt(result)) : undefined;
};

export function useDerivedMintInfo(
  AChain: SupportedXCallChains = 'icon',
  BChain: SupportedXCallChains = 'icon',
): {
  dependentField: Field;
  currencies: { [field in Field]?: Currency };
  pair?: Pair | null;
  pairState: PairState;
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> };
  currencyDeposits: { [field in Field]?: CurrencyAmount<Currency> };
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  price?: Price<Currency, Currency>;
  noLiquidity?: boolean;
  liquidityMinted?: CurrencyAmount<Token>;
  mintableLiquidity?: CurrencyAmount<Token>;
  poolTokenPercentage?: Percent;
  error?: ReactNode;
  minQuoteTokenAmount?: BigNumber | null;
} {
  const { account } = useIconReact();

  const {
    independentField,
    typedValue,
    otherTypedValue,
    [Field.CURRENCY_A]: { currency: currencyA },
    [Field.CURRENCY_B]: { currency: currencyB },
  } = useMintState();
  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;

  // tokens
  const currencies: { [field in Field]?: Currency } = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined,
    }),
    [currencyA, currencyB],
  );

  // pair
  const isQueue = isNativeCurrency(currencies[Field.CURRENCY_A]);

  // For queue, currencies[Field.CURRENCY_A] = ICX and currencies[Field.CURRENCY_B] = undefined
  // so used `useQueuePair` in addition to `useV2Pair`.
  const [pairState1, pair1] = useV2Pair(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]);
  const [pairState2, pair2] = useQueuePair();
  const [pairState, pair] = isQueue ? [pairState2, pair2] : [pairState1, pair1];

  const totalSupply = pair?.totalSupply;
  const noLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(totalSupply && JSBI.equal(totalSupply.quotient, ZERO)) ||
    Boolean(
      pairState === PairState.EXISTS &&
        pair &&
        JSBI.equal(pair.reserve0.quotient, ZERO) &&
        JSBI.equal(pair.reserve1.quotient, ZERO),
    );

  // balances
  const currencyArr = React.useMemo(() => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]], [currencies]);
  const balances = useCurrencyBalances(account ?? undefined, currencyArr);
  const balancesCrossChain = useCrossChainCurrencyBalances(currencyArr);
  const currencyBalances: { [field in Field]?: CurrencyAmount<Currency> } = React.useMemo(() => {
    if (AChain && BChain && balancesCrossChain) {
      return {
        [Field.CURRENCY_A]: balancesCrossChain[0]?.[AChain], // base token
        [Field.CURRENCY_B]: balancesCrossChain[1]?.[BChain], // quote token
      };
    } else {
      return {
        [Field.CURRENCY_A]: balances[0], // base token
        [Field.CURRENCY_B]: balances[1], // quote token
      };
    }
  }, [AChain, BChain, balances, balancesCrossChain]);

  // deposits
  const depositA = useCurrencyDeposit(account ?? undefined, currencyA);
  const depositB = useCurrencyDeposit(account ?? undefined, currencyB);
  const currencyDeposits: { [field in Field]?: CurrencyAmount<Currency> } = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: depositA,
      [Field.CURRENCY_B]: depositB,
    }),
    [depositA, depositB],
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
            ? pair.involvesToken(tokenA)
              ? pair.priceOf(tokenA).quote(wrappedIndependentAmount)
              : CurrencyAmount.fromRawAmount(tokenB, 0)
            : pair.involvesToken(tokenB)
            ? pair.priceOf(tokenB).quote(wrappedIndependentAmount)
            : CurrencyAmount.fromRawAmount(tokenA, 0);
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
      return pair && wrappedCurrencyA && pair.involvesToken(wrappedCurrencyA)
        ? pair.priceOf(wrappedCurrencyA)
        : undefined;
    }
  }, [currencyA, noLiquidity, pair, parsedAmounts]);

  // liquidity minted
  const liquidityMinted = React.useMemo(() => {
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts;
    const [tokenAmountA, tokenAmountB] = [currencyAAmount?.wrapped, currencyBAmount?.wrapped];
    if (
      pair &&
      totalSupply &&
      tokenAmountA &&
      tokenAmountB &&
      pair.involvesToken(tokenAmountA.currency) &&
      pair.involvesToken(tokenAmountB.currency) &&
      !tokenAmountA.currency.equals(tokenAmountB.currency)
    ) {
      try {
        return pair.getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB);
      } catch (error: any) {
        if (error.isInsufficientInputAmountError) {
          console.warn('useDerivedMintInfo(): liquidityMinted - Insufficient input amount');
          return undefined;
        }
        console.error(error);
        return undefined;
      }
    } else {
      return undefined;
    }
  }, [parsedAmounts, pair, totalSupply]);

  // mintable liquidity by using balances
  const mintableLiquidity = React.useMemo(() => {
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = currencyBalances;
    const [tokenAmountA, tokenAmountB] = [currencyAAmount?.wrapped, currencyBAmount?.wrapped];
    if (
      pair &&
      totalSupply &&
      tokenAmountA &&
      tokenAmountB &&
      ((pair.token0.symbol as string) === (tokenAmountA.currency.symbol as string) ||
        (pair.token1.symbol as string) === (tokenAmountA.currency.symbol as string)) &&
      pair.involvesToken(tokenAmountB.currency) &&
      !tokenAmountA.currency.equals(tokenAmountB.currency)
    ) {
      try {
        return pair.getLiquidityMinted(totalSupply, tokenAmountA, tokenAmountB);
      } catch (error: any) {
        if (error.isInsufficientInputAmountError) {
          console.warn('useDerivedMintInfo(): mintableLiquidity - Insufficient input amount');
          return undefined;
        }
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

  let error: ReactNode | undefined;
  if (!account) {
    error = <Trans>Connect Wallet</Trans>;
  }

  if (pairState === PairState.INVALID) {
    error = error ?? <Trans>Invalid pair</Trans>;
  }

  if (isQueue) {
    if (!parsedAmounts[Field.CURRENCY_A]) {
      error = error ?? <Trans>Enter an amount</Trans>;
    }

    const { [Field.CURRENCY_A]: currencyAAmount } = parsedAmounts;

    if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
      error = <>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance</>;
    }
  } else {
    if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
      error = error ?? <Trans>Enter an amount</Trans>;
    }

    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts;

    if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
      error = <Trans>Insufficient {currencies[Field.CURRENCY_A]?.symbol} balance</Trans>;
    }

    if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
      error = <Trans>Insufficient {currencies[Field.CURRENCY_B]?.symbol} balance</Trans>;
    }
  }

  return {
    dependentField,
    currencies,
    pair,
    pairState,
    currencyBalances,
    currencyDeposits,
    parsedAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    mintableLiquidity,
    poolTokenPercentage,
    error,
  };
}

export function useInitialSupplyLoad(): void {
  const [firstLoad, setFirstLoad] = React.useState<boolean>(true);
  const history = useHistory();
  const tokens = useAllTokens();
  const bases = useCommonBases();
  const { onCurrencySelection } = useMintActionHandlers(true);
  const { currencies } = useDerivedMintInfo();
  const { pair = '' } = useParams<{ pair: string }>();
  const ICX = useICX();

  React.useEffect(() => {
    if (firstLoad && Object.values(tokens).length > 0 && Object.values(bases).length > 0) {
      const tokensArray = Object.values(tokens);
      const basesArray = Object.values(bases);
      const currentCurrA = pair.split('_')[0];
      const currentCurrB = pair.split('_')[1];
      const currencyB =
        currentCurrB && basesArray.find(token => token.symbol?.toLowerCase() === currentCurrB?.toLocaleLowerCase());
      const currencyA =
        currentCurrA && tokensArray.find(token => token.symbol?.toLowerCase() === currentCurrA?.toLowerCase());
      if (currencyB && currencyA) {
        onCurrencySelection(Field.CURRENCY_A, currencyA);
        onCurrencySelection(Field.CURRENCY_B, currencyB);
      } else if (currentCurrA?.toLowerCase() === 'icx') {
        ICX && onCurrencySelection(Field.CURRENCY_A, ICX);
      } else {
        if (currencies.CURRENCY_A && currencies.CURRENCY_B) {
          history.replace(`/trade/supply/${currencies.CURRENCY_A.symbol}_${currencies.CURRENCY_B.symbol}`);
        } else {
          history.replace(`/trade/supply/${INITIAL_MINT.currencyA.symbol}_${INITIAL_MINT.currencyB.symbol}`);
        }
      }
      setFirstLoad(false);
    }
  }, [firstLoad, tokens, onCurrencySelection, history, currencies.CURRENCY_A, currencies.CURRENCY_B, bases, ICX, pair]);
}
