import React, { useCallback, ReactNode, useEffect, useMemo } from 'react';

import { Currency, CurrencyAmount, Price, Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { useAllTokens, useCommonBases } from '@/hooks/Tokens';
import { PairState, useV2Pair } from '@/hooks/useV2Pairs';
import { tryParseAmount } from '@/store/swap/hooks';
import { useXTokenBalances } from '@/store/wallet/hooks';
import { maxAmountSpend } from '@/utils';
import { formatSymbol } from '@/utils/formatter';
import {
  ICON_XCALL_NETWORK_ID,
  XChainId,
  XToken,
  convertCurrency,
  convertCurrencyAmount,
  getXChainType,
  useXAccount,
  xTokenMap,
} from '@balancednetwork/xwagmi';
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
      const _currency = currency instanceof XToken ? currency : convertCurrency(ICON_XCALL_NETWORK_ID, currency)!;
      dispatch(
        selectCurrency({
          field,
          currency: _currency.unwrapped,
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

export function useDerivedMintInfo(): {
  dependentField: Field;
  currencies: { [field in Field]?: XToken };
  pair?: Pair | null;
  pairState: PairState;
  currencyBalances: { [field in Field]?: CurrencyAmount<XToken> };
  maxAmounts: { [field in Field]?: CurrencyAmount<XToken> };
  parsedAmounts: { [field in Field]?: CurrencyAmount<Currency> };
  price?: Price<Currency, Currency>;
  noLiquidity?: boolean;
  liquidityMinted?: CurrencyAmount<Token>;
  mintableLiquidity?: CurrencyAmount<Token>;
  error?: ReactNode;
  minQuoteTokenAmount?: BigNumber | null;
  lpXChainId: XChainId;
  account: string | undefined;
} {
  const {
    independentField,
    typedValue,
    otherTypedValue,
    [Field.CURRENCY_A]: { currency: currencyA },
    [Field.CURRENCY_B]: { currency: currencyB },
  } = useMintState();
  const dependentField = independentField === Field.CURRENCY_A ? Field.CURRENCY_B : Field.CURRENCY_A;

  // tokens
  const currencies: { [field in Field]?: XToken } = useMemo(
    () => ({
      [Field.CURRENCY_A]: currencyA ?? undefined,
      [Field.CURRENCY_B]: currencyB ?? undefined,
    }),
    [currencyA, currencyB],
  );

  const lpXChainId = useMemo(() => {
    return currencies[Field.CURRENCY_A]?.xChainId || '0x1.icon';
  }, [currencies]);

  const account = useXAccount(getXChainType(lpXChainId)).address;

  const currencyAOnIcon = useMemo(() => {
    return convertCurrency(ICON_XCALL_NETWORK_ID, currencyA?.wrapped);
  }, [currencyA]);

  const currencyBOnIcon = useMemo(() => {
    return convertCurrency(ICON_XCALL_NETWORK_ID, currencyB?.wrapped);
  }, [currencyB]);

  const currenciesOnIcon: { [field in Field]?: XToken } = useMemo(() => {
    return {
      [Field.CURRENCY_A]: currencyAOnIcon ?? undefined,
      [Field.CURRENCY_B]: currencyBOnIcon ?? undefined,
    };
  }, [currencyAOnIcon, currencyBOnIcon]);

  const [pairState, pair] = useV2Pair(currencyAOnIcon, currencyBOnIcon);

  const totalSupply = pair?.totalSupply;
  const noLiquidity: boolean =
    pairState === PairState.NOT_EXISTS ||
    Boolean(totalSupply && totalSupply.quotient === ZERO) ||
    Boolean(
      pairState === PairState.EXISTS && pair && pair.reserve0.quotient === ZERO && pair.reserve1.quotient === ZERO,
    );

  // balances
  const currencyArr = useMemo(() => [currencies[Field.CURRENCY_A], currencies[Field.CURRENCY_B]], [currencies]);

  const balances = useXTokenBalances(currencyArr);
  const currencyBalances: { [field in Field]?: CurrencyAmount<XToken> } = useMemo(() => {
    const currencyABalance = balances[0];
    const currencyBBalance = balances[1];
    return {
      [Field.CURRENCY_A]: currencyABalance, // base token
      [Field.CURRENCY_B]: currencyBBalance, // quote token
    };
  }, [balances]);

  // amounts
  const independentAmount: CurrencyAmount<Currency> | undefined = tryParseAmount(
    typedValue,
    currenciesOnIcon[independentField],
  );
  const dependentAmount: CurrencyAmount<Currency> | undefined = useMemo(() => {
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

  const parsedAmounts: { [field in Field]: CurrencyAmount<Currency> | undefined } = useMemo(() => {
    return {
      [Field.CURRENCY_A]: independentField === Field.CURRENCY_A ? independentAmount : dependentAmount,
      [Field.CURRENCY_B]: independentField === Field.CURRENCY_A ? dependentAmount : independentAmount,
    };
  }, [dependentAmount, independentAmount, independentField]);

  const price = useMemo(() => {
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
  const liquidityMinted = useMemo(() => {
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

  const maxAmounts = useMemo(
    () => ({
      [Field.CURRENCY_A]: maxAmountSpend(currencyBalances[Field.CURRENCY_A]),
      [Field.CURRENCY_B]: maxAmountSpend(currencyBalances[Field.CURRENCY_B]),
    }),
    [currencyBalances],
  );

  // mintable liquidity by using balances
  const mintableLiquidity = useMemo(() => {
    const { [Field.CURRENCY_A]: currencyAAmount, [Field.CURRENCY_B]: currencyBAmount } = {
      [Field.CURRENCY_A]: maxAmounts[Field.CURRENCY_A]
        ? convertCurrencyAmount(ICON_XCALL_NETWORK_ID, maxAmounts[Field.CURRENCY_A])
        : undefined,
      [Field.CURRENCY_B]: maxAmounts[Field.CURRENCY_B]
        ? convertCurrencyAmount(ICON_XCALL_NETWORK_ID, maxAmounts[Field.CURRENCY_B])
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
  }, [maxAmounts, pair, totalSupply]);

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
    parsedAmounts,
    maxAmounts,
    price,
    noLiquidity,
    liquidityMinted,
    mintableLiquidity,
    error,
    lpXChainId,
    account,
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

      const validXChainIds = Object.keys(xTokenMap);

      const [currentCurrA, xChainIdStr] = pair.split('_')[0].split(':');
      const xChainId: XChainId = validXChainIds.includes(xChainIdStr) ? (xChainIdStr as XChainId) : '0x1.icon';
      const currentCurrB = pair.split('_')[1];
      const currencyB =
        currentCurrB && basesArray.find(token => token.symbol?.toLowerCase() === currentCurrB?.toLocaleLowerCase());
      const currencyA =
        currentCurrA && tokensArray.find(token => token.symbol?.toLowerCase() === currentCurrA?.toLowerCase());
      if (currencyB && currencyA) {
        onCurrencySelection(Field.CURRENCY_A, convertCurrency(xChainId, currencyA)!);
        onCurrencySelection(Field.CURRENCY_B, convertCurrency(xChainId, currencyB)!);
      } else {
        // TODO: is this necessary?
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
  }, [firstLoad, tokens, onCurrencySelection, currencies.CURRENCY_A, currencies.CURRENCY_B, bases, pair, navigate]);

  useEffect(() => {
    if (!firstLoad && currencies && currencies[Field.CURRENCY_A] && currencies[Field.CURRENCY_B]) {
      const xChainId = currencies[Field.CURRENCY_A]?.xChainId;

      const inputCurrency = `${currencies[Field.CURRENCY_A].symbol}${xChainId ? `:${xChainId}` : ''}`;
      const outputCurrency = `${currencies[Field.CURRENCY_B].symbol}`;
      const newPair = `${inputCurrency}_${outputCurrency}`;

      if (pair !== newPair) {
        navigate(`/trade/supply/${newPair}`, { replace: true });
      }
    }
  }, [currencies, pair, navigate, firstLoad]);
}
