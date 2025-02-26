import React, { useCallback, ReactNode } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { Currency, CurrencyAmount, Percent, Price, Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useAllTokens, useCommonBases } from '@/hooks/Tokens';
import { PairState, useV2Pair } from '@/hooks/useV2Pairs';
import { tryParseAmount } from '@/store/swap/hooks';
import { useAllTransactions } from '@/store/transactions/hooks';
import { useCurrencyBalances } from '@/store/wallet/hooks';
import { maxAmountSpend } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import { bnJs } from '@balancednetwork/xwagmi';
import { AppDispatch, AppState } from '../index';
import { Field, INITIAL_MINT, InputType, selectCurrency, typeInput } from './reducer';

export function useMintState(): AppState['mint'] {
  return useSelector<AppState, AppState['mint']>(state => state.mint);
}

export function useMintActionHandlers(noLiquidity: boolean | undefined): {
  onCurrencySelection: (field: Field, currency: Currency) => void;
  onFieldAInput: (typedValue: string) => void;
  onFieldBInput: (typedValue: string) => void;
  onSlide: (field: Field, typedValue: string) => void;
} {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
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
        const currentQuote = pair.split('_')[1];
        navigate(`/trade/supply/${currency.symbol}` + (currentQuote ? `_${currentQuote}` : ''), { replace: true });
      }
      if (field === Field.CURRENCY_B) {
        const currentBase = pair.split('_')[0];
        navigate(`/trade/supply/${currentBase}_${currency.symbol}`, { replace: true });
      }
    },
    [dispatch, pair, navigate],
  );

  const onFieldAInput = useCallback(
    (typedValue: string) => {
      dispatch(
        typeInput({
          field: Field.CURRENCY_A,
          typedValue,
          noLiquidity: noLiquidity === true,
          inputType: InputType.text,
        }),
      );
    },
    [dispatch, noLiquidity],
  );

  const onFieldBInput = useCallback(
    (typedValue: string) => {
      dispatch(
        typeInput({
          field: Field.CURRENCY_B,
          typedValue,
          noLiquidity: noLiquidity === true,
          inputType: InputType.text,
        }),
      );
    },
    [dispatch, noLiquidity],
  );

  const onSlide = useCallback(
    (field: Field, typedValue: string) => {
      dispatch(typeInput({ field, typedValue, noLiquidity: noLiquidity === true, inputType: InputType.slider }));
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

const ZERO = 0n;

// TODO: update this function not to use useCurrentXCallState, which is removed
const useCurrencyDeposit = (
  account: string | undefined | null,
  currency: Currency | undefined,
): CurrencyAmount<Currency> | undefined => {
  const token = currency?.wrapped;
  const transactions = useAllTransactions();
  const [result, setResult] = React.useState<string | undefined>();
  // const currentXCallState = useCurrentXCallState();

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    (async () => {
      if (token?.address && account) {
        const res = await bnJs.Dex.getDeposit(token?.address || '', account || '');
        setResult(res);
      }
    })();
  }, [transactions, token, account]);

  return token && result ? CurrencyAmount.fromRawAmount<Currency>(token, BigInt(result)) : undefined;
};

export function useDerivedMintInfo(): {
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
  error?: ReactNode;
  minQuoteTokenAmount?: BigNumber | null;
  maxAmounts: { [field in Field]?: CurrencyAmount<Currency> };
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

  const [pairState, pair] = useV2Pair(currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]);

  const totalSupply = pair?.totalSupply;
  const noLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(totalSupply && totalSupply.quotient === ZERO) ||
    Boolean(
      pairState === PairState.EXISTS && pair && pair.reserve0.quotient === ZERO && pair.reserve1.quotient === ZERO,
    );

  // balances
  const currencyArr = React.useMemo(() => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]], [currencies]);
  const balances = useCurrencyBalances(account ?? undefined, currencyArr);
  const currencyBalances: { [field in Field]?: CurrencyAmount<Currency> } = React.useMemo(() => {
    const currencyABalance = balances[0];
    const currencyBBalance = balances[1];
    return {
      [Field.CURRENCY_A]: currencyABalance, // base token
      [Field.CURRENCY_B]: currencyBBalance, // quote token
    };
  }, [balances]);

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

  const maxAmounts = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: maxAmountSpend(currencyBalances[Field.CURRENCY_A]),
      [Field.CURRENCY_B]: maxAmountSpend(currencyBalances[Field.CURRENCY_B]),
    }),
    [currencyBalances],
  );

  // mintable liquidity by using balances
  const mintableLiquidity = React.useMemo(() => {
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = maxAmounts;
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
          console.warn('useDerivedMintInfo(): mintableLiquidity - Insufficient input amount');
          return undefined;
        }
        console.error(error);
        return undefined;
      }
    } else {
      return undefined;
    }
  }, [pair, totalSupply, maxAmounts]);

  let error: ReactNode | undefined;
  if (!account) {
    error = <Trans>Connect Wallet</Trans>;
  }

  if (pairState === PairState.INVALID) {
    error = error ?? <Trans>Invalid pair</Trans>;
  }

  if (!parsedAmounts[Field.CURRENCY_A] || !parsedAmounts[Field.CURRENCY_B]) {
    error = error ?? <Trans>Enter amount</Trans>;
  }

  const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = parsedAmounts;

  if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
    error = <Trans>Insufficient {formatSymbol(currencies[Field.CURRENCY_A]?.symbol)} balance</Trans>;
  }

  if (currencyBAmount && currencyBalances?.[Field.CURRENCY_B]?.lessThan(currencyBAmount)) {
    error = <Trans>Insufficient {formatSymbol(currencies[Field.CURRENCY_B]?.symbol)} balance</Trans>;
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
    error,
    maxAmounts,
  };
}

export function useInitialSupplyLoad(): void {
  const [firstLoad, setFirstLoad] = React.useState<boolean>(true);
  const navigate = useNavigate();
  const tokens = useAllTokens();
  const bases = useCommonBases();
  const { onCurrencySelection } = useMintActionHandlers(true);
  const { currencies } = useDerivedMintInfo();
  const { pair = '' } = useParams<{ pair: string }>();

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
      } else {
        if (currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B]) {
          navigate(`/trade/supply/${currencies[Field.CURRENCY_A].symbol}_${currencies[Field.CURRENCY_B].symbol}`, {
            replace: true,
          });
        } else {
          navigate(`/trade/supply/${INITIAL_MINT.currencyA.symbol}_${INITIAL_MINT.currencyB.symbol}`, {
            replace: true,
          });
        }
      }
      setFirstLoad(false);
    }
  }, [firstLoad, tokens, onCurrencySelection, currencies, bases, pair, navigate]);
}
