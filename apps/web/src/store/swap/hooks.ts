import React, { useCallback, useMemo } from 'react';

import { TradeType, Currency, CurrencyAmount, Token, Price } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { t } from '@lingui/macro';
import JSBI from 'jsbi';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, useParams } from 'react-router-dom';

import { SupportedXCallChains } from 'app/_xcall/types';
import { canBeQueue } from 'constants/currency';
import { useAllTokens } from 'hooks/Tokens';
import { PairState, useV2Pair } from 'hooks/useV2Pairs';
import { useSwapSlippageTolerance } from 'store/application/hooks';
import { useCrossChainCurrencyBalances, useCurrencyBalances } from 'store/wallet/hooks';
import { parseUnits } from 'utils';

import { AppDispatch, AppState } from '../index';
import { Field, selectCurrency, selectPercent, setRecipient, switchCurrencies, typeInput } from './actions';
import { INITIAL_SWAP } from './reducer';
import { useTradeExactIn, useTradeExactOut } from './trade';

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap);
}

export function useSwapActionHandlers(): {
  onCurrencySelection: (field: Field, currency: Currency) => void;
  onPercentSelection: (field: Field, percent: number, value: string) => void;
  onSwitchTokens: () => void;
  onUserInput: (field: Field, typedValue: string) => void;
  onChangeRecipient: (recipient: string | null) => void;
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
      if (field === Field.INPUT) {
        const currentQuote = pair.split('_')[1];
        history.replace(`/trade/${currency.symbol}_${currentQuote}`);
      }
      if (field === Field.OUTPUT) {
        const currentBase = pair.split('_')[0];
        history.replace(`/trade/${currentBase}_${currency.symbol}`);
      }
    },
    [dispatch, history, pair],
  );

  const onPercentSelection = useCallback(
    (field: Field, percent: number, value: string) => {
      dispatch(selectPercent({ field, percent, value }));
    },
    [dispatch],
  );

  const onSwitchTokens = useCallback(() => {
    const currentBase = pair.split('_')[0];
    const currentQuote = pair.split('_')[1];
    history.replace(`/trade/${currentQuote}_${currentBase}`);
    dispatch(switchCurrencies());
  }, [pair, history, dispatch]);

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

// try to parse a user entered amount for a given token
export function tryParseAmount(value?: string, currency?: Currency): CurrencyAmount<Currency> | undefined {
  if (!value || !currency) {
    return undefined;
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString();
    if (typedValueParsed !== '0') {
      return CurrencyAmount.fromRawAmount(currency, JSBI.BigInt(typedValueParsed));
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error);
  }
  // necessary for all paths to return a value
  return undefined;
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(
  inputChain: SupportedXCallChains = 'icon',
  outputChain: SupportedXCallChains = 'icon',
): {
  trade: Trade<Currency, Currency, TradeType> | undefined;
  currencies: { [field in Field]?: Currency };
  percents: { [field in Field]?: number };
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> | undefined };
  parsedAmount: CurrencyAmount<Currency> | undefined;
  inputError?: string;
  allowedSlippage: number;
  price: Price<Token, Token> | undefined;
} {
  const { account } = useIconReact();

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currency: inputCurrency, percent: inputPercent },
    [Field.OUTPUT]: { currency: outputCurrency },
  } = useSwapState();

  const relevantTokenBalances = useCurrencyBalances(
    account ?? undefined,
    useMemo(() => [inputCurrency ?? undefined, outputCurrency ?? undefined], [inputCurrency, outputCurrency]),
  );
  const balancesCrossChain = useCrossChainCurrencyBalances([inputCurrency, outputCurrency]);

  const isExactIn: boolean = independentField === Field.INPUT;
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined);
  const currencyBalances: { [field in Field]?: CurrencyAmount<Currency> } = React.useMemo(() => {
    if (inputChain && outputChain && balancesCrossChain) {
      return {
        [Field.INPUT]: balancesCrossChain[0]?.[inputChain],
        [Field.OUTPUT]: balancesCrossChain[1]?.[outputChain],
      };
    } else {
      return {
        [Field.INPUT]: relevantTokenBalances[0],
        [Field.OUTPUT]: relevantTokenBalances[1],
      };
    }
  }, [inputChain, outputChain, relevantTokenBalances, balancesCrossChain]);

  const currencies: { [field in Field]?: Currency } = useMemo(() => {
    return {
      [Field.INPUT]: inputCurrency ?? undefined,
      [Field.OUTPUT]: outputCurrency ?? undefined,
    };
  }, [inputCurrency, outputCurrency]);

  const percents: { [field in Field]?: number } = React.useMemo(
    () => ({
      [Field.INPUT]: inputPercent,
    }),
    [inputPercent],
  );

  // cannot call `useTradeExactIn` or `useTradeExactOut` conditionally because they are hooks
  const queue = canBeQueue(inputCurrency, outputCurrency);
  const trade1 = useTradeExactIn(isExactIn ? parsedAmount : undefined, outputCurrency, {
    maxHops: queue ? 1 : undefined,
  });
  const trade2 = useTradeExactOut(inputCurrency, !isExactIn ? parsedAmount : undefined, {
    maxHops: queue ? 1 : undefined,
  });
  const trade = isExactIn ? trade1 : trade2;

  let inputError: string | undefined;
  if (!account) {
    inputError = t`Connect Wallet`;
  }

  if (!parsedAmount) {
    inputError = inputError ?? t`Enter amount`;
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? t`Select a token`;
  }

  // compare input balance to max input based on version
  const allowedSlippage = useSwapSlippageTolerance();

  const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade?.inputAmount];

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = t`Insufficient ${currencies[Field.INPUT]?.symbol}`;
  }

  //
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmount?.greaterThan(0),
  );

  if (userHasSpecifiedInputOutput && !trade) inputError = t`Insufficient liquidity`;

  const [pairState, pair] = useV2Pair(inputCurrency, outputCurrency);

  let price: Price<Token, Token> | undefined;
  if (pair && pairState === PairState.EXISTS && inputCurrency) {
    if (pair.involvesToken(inputCurrency.wrapped)) price = pair.priceOf(inputCurrency.wrapped);
    else price = pair.token0Price; // pair not ready, just set dummy price
  }

  return {
    trade,
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    allowedSlippage,
    percents,
    price,
  };
}

export function useInitialSwapLoad(): void {
  const [firstLoad, setFirstLoad] = React.useState<boolean>(true);
  const history = useHistory();
  const tokens = useAllTokens();
  const { pair = '' } = useParams<{ pair: string }>();
  const { onCurrencySelection } = useSwapActionHandlers();
  const { currencies } = useDerivedSwapInfo();

  React.useEffect(() => {
    if (firstLoad && Object.values(tokens).length > 0) {
      const tokensArray = Object.values(tokens);
      const currentBase = pair.split('_')[0];
      const currentQuote = pair.split('_')[1];
      const quote =
        currentQuote && tokensArray.find(token => token.symbol?.toLowerCase() === currentQuote?.toLocaleLowerCase());
      const base = currentBase && tokensArray.find(token => token.symbol?.toLowerCase() === currentBase?.toLowerCase());
      if (quote && base) {
        onCurrencySelection(Field.INPUT, base);
        onCurrencySelection(Field.OUTPUT, quote);
      } else {
        if (currencies.INPUT && currencies.OUTPUT) {
          history.replace(`/trade/${currencies.INPUT.symbol}_${currencies.OUTPUT.symbol}`);
        } else {
          history.replace(`/trade/${INITIAL_SWAP.base.symbol}_${INITIAL_SWAP.quote.symbol}`);
        }
      }
      setFirstLoad(false);
    }
  }, [firstLoad, tokens, onCurrencySelection, history, currencies.INPUT, currencies.OUTPUT, pair]);
}
