import React, { useCallback, ReactNode, useEffect, useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { Currency, CurrencyAmount, Percent, Price, Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useICX } from '@/constants/tokens';
import { useAllTokens, useCommonBases } from '@/hooks/Tokens';
import { useQueuePair } from '@/hooks/useQueuePair';
import { PairState, useV2Pair } from '@/hooks/useV2Pairs';
import { tryParseAmount } from '@/store/swap/hooks';
import { useAllTransactions } from '@/store/transactions/hooks';
import { useXTokenBalances } from '@/store/wallet/hooks';
import { formatSymbol } from '@/utils/formatter';
import { XChainId, XToken, xTokenMap, xTokenMapBySymbol } from '@balancednetwork/xwagmi';
import { bnJs } from '@balancednetwork/xwagmi';
import { AppDispatch, AppState } from '../index';
import { Field, INITIAL_MINT, InputType, selectChain, selectCurrency, typeInput } from './reducer';

export function useMintState(): AppState['mint'] {
  return useSelector<AppState, AppState['mint']>(state => state.mint);
}

export function useMintActionHandlers(noLiquidity: boolean | undefined): {
  onCurrencySelection: (field: Field, currency: Currency) => void;
  onFieldAInput: (typedValue: string) => void;
  onFieldBInput: (typedValue: string) => void;
  onSlide: (field: Field, typedValue: string) => void;
  onChainSelection: (field: Field, xChainId: XChainId) => void;
} {
  const dispatch = useDispatch<AppDispatch>();

  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currency: currency instanceof XToken ? currency : xTokenMapBySymbol['0x1.icon'][currency.symbol],
        }),
      );
    },
    [dispatch],
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

  const onChainSelection = useCallback(
    (field: Field, xChainId: XChainId) => {
      dispatch(
        selectChain({
          field,
          xChainId,
        }),
      );
    },
    [dispatch],
  );

  return {
    onCurrencySelection,
    onFieldAInput,
    onFieldBInput,
    onSlide,
    onChainSelection,
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

export function useDerivedMintInfo(
  AChain: XChainId = '0x1.icon',
  BChain: XChainId = '0x1.icon',
): {
  dependentField: Field;
  currencies: { [field in Field]?: XToken };
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
  lpXChainId: XChainId;
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
  const currencies: { [field in Field]?: XToken } = React.useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined,
    }),
    [currencyA, currencyB],
  );

  const currencyAOnIcon = useMemo(() => {
    return currencyA ? xTokenMapBySymbol['0x1.icon'][currencyA.symbol] : undefined;
  }, [currencyA]);

  const currencyBOnIcon = useMemo(() => {
    return currencyB ? xTokenMapBySymbol['0x1.icon'][currencyB.symbol] : undefined;
  }, [currencyB]);

  const currenciesOnIcon: { [field in Field]?: XToken } = React.useMemo(() => {
    return {
      [Field.CURRENCY_A]: currencyAOnIcon ?? undefined,
      [Field.CURRENCY_B]: currencyBOnIcon ?? undefined,
    };
  }, [currencyAOnIcon, currencyBOnIcon]);

  // pair
  const isQueue = currencies[Field.CURRENCY_A]?.isNativeToken && currencies[Field.CURRENCY_A]?.xChainId === '0x1.icon';

  // For queue, currencies[Field.CURRENCY_A] = ICX and currencies[Field.CURRENCY_B] = undefined
  // so used `useQueuePair` in addition to `useV2Pair`.
  const [pairState1, pair1] = useV2Pair(currencyAOnIcon, currencyBOnIcon);
  const [pairState2, pair2] = useQueuePair();
  const [pairState, pair] = isQueue ? [pairState2, pair2] : [pairState1, pair1];

  const totalSupply = pair?.totalSupply;
  const noLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(totalSupply && totalSupply.quotient === ZERO) ||
    Boolean(
      pairState === PairState.EXISTS && pair && pair.reserve0.quotient === ZERO && pair.reserve1.quotient === ZERO,
    );

  // balances
  const currencyArr = React.useMemo(() => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]], [currencies]);

  const lpXChainId = useMemo(() => {
    return currencies[Field.CURRENCY_A]?.xChainId || '0x1.icon';
  }, [currencies]);

  const balances = useXTokenBalances(currencyArr);
  const currencyBalances: { [field in Field]?: CurrencyAmount<XToken> } = React.useMemo(() => {
    const currencyABalance = balances[0];
    const currencyBBalance = balances[1];
    return {
      [Field.CURRENCY_A]: currencyABalance, // base token
      [Field.CURRENCY_B]: currencyBBalance, // quote token
    };
  }, [balances]);

  // deposits
  const depositA = useCurrencyDeposit(account ?? undefined, currencyAOnIcon);
  const depositB = useCurrencyDeposit(account ?? undefined, currencyBOnIcon);
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
    currenciesOnIcon[independentField],
  );
  const dependentAmount: CurrencyAmount<Currency> | undefined = React.useMemo(() => {
    if (noLiquidity) {
      if (otherTypedValue && currenciesOnIcon[dependentField]) {
        return tryParseAmount(otherTypedValue, currenciesOnIcon[dependentField]);
      }
      return undefined;
    } else if (independentAmount) {
      if (currencyAOnIcon && currencyBOnIcon && independentAmount && pair) {
        const dependentCurrency = dependentField === Field.CURRENCY_B ? currencyBOnIcon : currencyAOnIcon;
        const dependentTokenAmount =
          dependentField === Field.CURRENCY_B
            ? pair.involvesToken(currencyAOnIcon)
              ? pair.priceOf(currencyAOnIcon).quote(independentAmount)
              : CurrencyAmount.fromRawAmount(currencyBOnIcon, 0)
            : pair.involvesToken(currencyBOnIcon)
              ? pair.priceOf(currencyBOnIcon).quote(independentAmount)
              : CurrencyAmount.fromRawAmount(currencyAOnIcon, 0);

        return dependentCurrency.isNativeToken
          ? CurrencyAmount.fromRawAmount(dependentCurrency, dependentTokenAmount.quotient)
          : dependentTokenAmount;
      }
      return undefined;
    } else {
      return undefined;
    }
  }, [
    noLiquidity,
    otherTypedValue,
    dependentField,
    independentAmount,
    pair,
    currenciesOnIcon,
    currencyAOnIcon,
    currencyBOnIcon,
  ]);

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
      return pair && currencyAOnIcon && pair.involvesToken(currencyAOnIcon) ? pair.priceOf(currencyAOnIcon) : undefined;
    }
  }, [currencyAOnIcon, noLiquidity, pair, parsedAmounts]);

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
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = {
      [Field.CURRENCY_A]: currencyBalances[Field.CURRENCY_A]
        ? CurrencyAmount.fromRawAmount(currencyAOnIcon, currencyBalances[Field.CURRENCY_A]?.quotient)
        : undefined,
      [Field.CURRENCY_B]: currencyBalances[Field.CURRENCY_B]
        ? CurrencyAmount.fromRawAmount(currencyBOnIcon, currencyBalances[Field.CURRENCY_B]?.quotient)
        : undefined,
    };

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
  }, [currencyBalances, pair, totalSupply, currencyAOnIcon, currencyBOnIcon]);

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
      error = error ?? <Trans>Enter amount</Trans>;
    }

    const { [Field.CURRENCY_A]: currencyAAmount } = parsedAmounts;

    if (currencyAAmount && currencyBalances?.[Field.CURRENCY_A]?.lessThan(currencyAAmount)) {
      error = <>Insufficient {formatSymbol(currencies[Field.CURRENCY_A]?.symbol)} balance</>;
    }
  } else {
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
    lpXChainId,
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
  const ICX = useICX();

  React.useEffect(() => {
    if (firstLoad && Object.values(tokens).length > 0 && Object.values(bases).length > 0) {
      const tokensArray = Object.values(tokens);
      const basesArray = Object.values(bases);

      const validXChainIds = Object.keys(xTokenMap);

      const [currentCurrA, xChainIdStr] = pair.split('_')[0].split(':');
      const xChainId: XChainId = validXChainIds.includes(xChainIdStr) ? (xChainIdStr as XChainId) : '0x1.icon';
      const currentCurrB = pair.split('_')[1];
      const currencyB =
        currentCurrB && basesArray.find(token => token.symbol?.toLowerCase() === currentCurrB?.toLocaleLowerCase());
      const currencyA =
        currentCurrA && tokensArray.find(token => token.symbol?.toLowerCase() === currentCurrA?.toLowerCase());
      if (currencyB && currencyA) {
        onCurrencySelection(Field.CURRENCY_A, xTokenMapBySymbol[xChainId][currencyA.symbol]);
        onCurrencySelection(Field.CURRENCY_B, xTokenMapBySymbol[xChainId][currencyB.symbol]);
      } else if (currentCurrA?.toLowerCase() === 'icx') {
        ICX && onCurrencySelection(Field.CURRENCY_A, xTokenMapBySymbol[xChainId][ICX.symbol]);
      } else {
        if (currencies.CURRENCY_A && currencies.CURRENCY_B) {
          navigate(
            `/trade/supply/${currencies.CURRENCY_A.symbol}:${currencies.CURRENCY_A.xChainId}_${currencies.CURRENCY_B.symbol}`,
            { replace: true },
          );
        } else {
          navigate(
            `/trade/supply/${INITIAL_MINT.currencyA.symbol}:${INITIAL_MINT.currencyA.xChainId}_${INITIAL_MINT.currencyB.symbol}`,
            {
              replace: true,
            },
          );
        }
      }
      setFirstLoad(false);
    }
  }, [
    firstLoad,
    tokens,
    onCurrencySelection,
    currencies.CURRENCY_A,
    currencies.CURRENCY_B,
    bases,
    ICX,
    pair,
    navigate,
  ]);
}
