import { useCallback, useEffect, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, Fraction, Price, Token, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { t } from '@lingui/macro';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { canBeQueue } from '@/constants/currency';
import { PRICE_IMPACT_SWAP_DISABLED_THRESHOLD } from '@/constants/misc';
import { useAssetManagerTokens } from '@/hooks/useAssetManagerTokens';
import { PairState, useV2Pair } from '@/hooks/useV2Pairs';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { useWalletBalances } from '@/store/wallet/hooks';
import { parseUnits } from '@/utils';
import { getXTokenBySymbol } from '@/utils/xTokens';
import { getXChainType } from '@balancednetwork/xwagmi';
import { allXTokens } from '@balancednetwork/xwagmi';
import { useXAccount } from '@balancednetwork/xwagmi';
import { XChainId, XToken } from '@balancednetwork/xwagmi';
import { validateAddress } from '@balancednetwork/xwagmi';
import { XTransactionType } from '@balancednetwork/xwagmi';
import BigNumber from 'bignumber.js';
import { AppDispatch, AppState } from '../index';
import { Field, selectCurrency, selectPercent, setRecipient, switchCurrencies, typeInput } from './reducer';
import { useTradeExactIn, useTradeExactOut } from './trade';

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap);
}

export function useSwapActionHandlers() {
  const dispatch = useDispatch<AppDispatch>();

  const onCurrencySelection = useCallback(
    (field: Field, currency: XToken) => {
      dispatch(
        selectCurrency({
          field,
          currency: currency,
        }),
      );
    },
    [dispatch],
  );

  const onPercentSelection = useCallback(
    (field: Field, percent: number, value: string) => {
      dispatch(selectPercent({ field, percent, value }));
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

const calculateXTransactionType = (
  token1: XToken | undefined,
  token2: XToken | undefined,
): XTransactionType | undefined => {
  if (!token1 || !token2) return undefined;

  if (token1.xChainId === token2.xChainId && token2.xChainId === '0x1.icon') {
    return XTransactionType.SWAP_ON_ICON;
  } else if (token1.symbol === token2.symbol) {
    return XTransactionType.BRIDGE;
  } else {
    return XTransactionType.SWAP;
  }
};

// try to parse a user entered amount for a given token
function tryParseAmount(value?: string, currency?: XToken): CurrencyAmount<XToken> | undefined {
  if (!value || !currency) {
    return undefined;
  }
  try {
    const typedValueParsed = parseUnits(value, currency.decimals).toString();
    if (typedValueParsed !== '0') {
      return CurrencyAmount.fromRawAmount(currency, BigInt(typedValueParsed));
    }
  } catch (error) {
    // should fail if the user specifies too many decimal places of precision (or maybe exceed max uint?)
    console.debug(`Failed to parse input amount: "${value}"`, error);
  }
  // necessary for all paths to return a value
  return undefined;
}

// from the current swap inputs, compute the best trade and return it.
export function useDerivedSwapInfo(): {
  accounts: { [field in Field]?: string | undefined };
  trade: Trade<Currency, Currency, TradeType> | undefined;
  currencies: { [field in Field]?: XToken };
  percents: { [field in Field]?: number };
  currencyBalances: { [field in Field]?: CurrencyAmount<XToken> | undefined };
  parsedAmount: CurrencyAmount<XToken> | undefined;
  currencyAmounts: { [field in Field]?: CurrencyAmount<XToken> | undefined };
  formattedAmounts: { [field in Field]: string };
  inputError?: string;
  outputError?: string;
  price: Price<Token, Token> | undefined;
  direction: { from: XChainId; to: XChainId };
  canBridge: boolean;
  maximumBridgeAmount: CurrencyAmount<XToken> | undefined;
  xTransactionType?: XTransactionType;
} {
  const {
    independentField,
    typedValue,
    recipient,
    [Field.INPUT]: { currency: inputCurrency, percent: inputPercent },
    [Field.OUTPUT]: { currency: outputCurrency },
  } = useSwapState();
  const inputXChainId = inputCurrency?.xChainId;
  const outputXChainId = outputCurrency?.xChainId;

  const xTransactionType = useMemo(() => {
    return calculateXTransactionType(inputCurrency, outputCurrency);
  }, [inputCurrency, outputCurrency]);

  const inputAccount = useXAccount(getXChainType(inputXChainId));
  const outputAccount = useXAccount(getXChainType(outputXChainId));
  const accounts = useMemo(
    () => ({
      [Field.INPUT]: inputAccount.address,
      [Field.OUTPUT]: outputAccount.address,
    }),
    [inputAccount, outputAccount],
  );

  const walletBalances = useWalletBalances();

  const _isExactIn = independentField === Field.INPUT;
  const parsedAmount = tryParseAmount(typedValue, (_isExactIn ? inputCurrency : outputCurrency) ?? undefined);
  const currencyBalances: { [field in Field]?: CurrencyAmount<XToken> } = useMemo(
    () => ({
      [Field.INPUT]: inputCurrency ? walletBalances?.[inputCurrency?.id] : undefined,
      [Field.OUTPUT]: outputCurrency ? walletBalances?.[outputCurrency?.id] : undefined,
    }),
    [walletBalances, inputCurrency, outputCurrency],
  );

  const currencies: { [field in Field]?: XToken } = useMemo(
    () => ({ [Field.INPUT]: inputCurrency, [Field.OUTPUT]: outputCurrency }),
    [inputCurrency, outputCurrency],
  );

  const percents: { [field in Field]?: number } = useMemo(() => ({ [Field.INPUT]: inputPercent }), [inputPercent]);

  const _inputCurrencyOnIcon = getXTokenBySymbol('0x1.icon', inputCurrency?.symbol);
  const _outputCurrencyOnIcon = getXTokenBySymbol('0x1.icon', outputCurrency?.symbol);
  const _parsedAmountOnIcon = tryParseAmount(
    typedValue,
    (_isExactIn ? _inputCurrencyOnIcon : _outputCurrencyOnIcon) ?? undefined,
  );
  // cannot call `useTradeExactIn` or `useTradeExactOut` conditionally because they are hooks
  const _queue = canBeQueue(_inputCurrencyOnIcon, _outputCurrencyOnIcon);
  const _trade1 = useTradeExactIn(_isExactIn ? _parsedAmountOnIcon : undefined, _outputCurrencyOnIcon, {
    maxHops: _queue ? 1 : undefined,
  });
  const _trade2 = useTradeExactOut(_inputCurrencyOnIcon, !_isExactIn ? _parsedAmountOnIcon : undefined, {
    maxHops: _queue ? 1 : undefined,
  });
  const trade = useMemo(() => {
    if (xTransactionType === XTransactionType.BRIDGE) return;

    return _isExactIn ? _trade1 : _trade2;
  }, [_isExactIn, _trade1, _trade2, xTransactionType]);

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const parsedAmounts = useMemo(() => {
    if (xTransactionType === XTransactionType.BRIDGE) {
      return { [Field.INPUT]: parsedAmount, [Field.OUTPUT]: parsedAmount };
    }

    return {
      [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
    };
  }, [independentField, parsedAmount, trade, xTransactionType]);

  const formattedAmounts = useMemo(() => {
    return {
      [independentField]: typedValue,
      [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    } as { [field in Field]: string };
  }, [dependentField, independentField, parsedAmounts, typedValue]);

  const inputCurrencyAmount = useMemo(() => {
    if (inputCurrency && formattedAmounts[Field.INPUT] && !Number.isNaN(parseFloat(formattedAmounts[Field.INPUT]))) {
      return CurrencyAmount.fromRawAmount(
        inputCurrency,
        new BigNumber(formattedAmounts[Field.INPUT]).times(10 ** inputCurrency.wrapped.decimals).toFixed(0),
      );
    }
    return undefined;
  }, [formattedAmounts[Field.INPUT], inputCurrency]);

  const outputCurrencyAmount = useMemo(() => {
    if (outputCurrency && formattedAmounts[Field.OUTPUT] && !Number.isNaN(parseFloat(formattedAmounts[Field.OUTPUT]))) {
      return CurrencyAmount.fromRawAmount(
        outputCurrency,
        new BigNumber(formattedAmounts[Field.OUTPUT]).times(10 ** outputCurrency.wrapped.decimals).toFixed(0),
      );
    }
    return undefined;
  }, [formattedAmounts[Field.OUTPUT], outputCurrency]);

  const currencyAmounts = useMemo(() => {
    return { [Field.INPUT]: inputCurrencyAmount, [Field.OUTPUT]: outputCurrencyAmount };
  }, [inputCurrencyAmount, outputCurrencyAmount]);

  const gasChecker = useXCallGasChecker(currencyAmounts[Field.INPUT]);

  const inputError = useMemo(() => {
    let error: string | undefined;

    if (accounts[Field.INPUT]) {
      if (!recipient) {
        if (accounts[Field.OUTPUT]) {
          error = error ?? t`Type an address`;
        } else {
          error = error ?? t`Connect or add address`;
        }
      } else if (outputXChainId && !validateAddress(recipient, outputXChainId)) {
        error = error ?? t`Invalid address`;
      } else if (!parsedAmount) {
        error = error ?? t`Enter amount`;
      }
    }

    if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
      error = error ?? t`Select a token`;
    }

    if (xTransactionType === XTransactionType.BRIDGE) {
      const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], parsedAmount];

      if (balanceIn && amountIn && new BigNumber(balanceIn.toFixed()).isLessThan(amountIn.toFixed())) {
        error = error ?? t`Insufficient ${currencies[Field.INPUT]?.symbol}`;
      }
    } else {
      const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade?.inputAmount];

      if (balanceIn && amountIn && new BigNumber(balanceIn.toFixed()).isLessThan(amountIn.toFixed())) {
        error = error ?? t`Insufficient ${currencies[Field.INPUT]?.symbol}`;
      }
    }

    if (!gasChecker.hasEnoughGas) {
      error = error ?? t`Insufficient gas`;
    }

    return error;
  }, [
    accounts,
    recipient,
    parsedAmount,
    currencies,
    currencyBalances,
    trade,
    xTransactionType,
    gasChecker,
    outputXChainId,
  ]);

  const outputError = useMemo(() => {
    let error: string | undefined;

    if (trade?.priceImpact.greaterThan(PRICE_IMPACT_SWAP_DISABLED_THRESHOLD)) {
      error = error ?? t`Reduce price impact`;
    }

    const userHasSpecifiedInputOutput = Boolean(
      currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmount?.greaterThan(0),
    );

    if (userHasSpecifiedInputOutput && !trade && xTransactionType === XTransactionType.SWAP) {
      error = error ?? t`Insufficient liquidity`;
    }

    return error;
  }, [trade, currencies, parsedAmount, xTransactionType]);

  const [_pairState, _pair] = useV2Pair(_inputCurrencyOnIcon, _outputCurrencyOnIcon);
  const price = useMemo(() => {
    let price: Price<Token, Token> | undefined;
    if (_pair && _pairState === PairState.EXISTS && _inputCurrencyOnIcon) {
      if (_pair.involvesToken(_inputCurrencyOnIcon.wrapped)) {
        price = _pair.priceOf(_inputCurrencyOnIcon.wrapped);
      } else {
        price = _pair.token0Price; // pair not ready, just set dummy price
      }
    }
    return price;
  }, [_pair, _pairState, _inputCurrencyOnIcon]);

  const direction = useMemo(
    () => ({ from: inputXChainId || '0x1.icon', to: outputXChainId || '0x1.icon' }),
    [inputXChainId, outputXChainId],
  );

  const { data: assetManager } = useAssetManagerTokens();

  const maximumBridgeAmount = useMemo(() => {
    if (currencies[Field.OUTPUT] instanceof XToken) {
      return assetManager?.[currencies[Field.OUTPUT].id ?? '']?.depositedAmount;
    }
  }, [assetManager, currencies[Field.OUTPUT]]);

  const canBridge = useMemo(() => {
    return maximumBridgeAmount && outputCurrencyAmount ? maximumBridgeAmount?.greaterThan(outputCurrencyAmount) : true;
  }, [maximumBridgeAmount, outputCurrencyAmount]);

  return {
    accounts,
    trade,
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    outputError,
    percents,
    price,
    direction,
    formattedAmounts,
    canBridge,
    maximumBridgeAmount,
    xTransactionType,
    currencyAmounts,
  };
}

export function useInitialSwapLoad(): void {
  const [firstLoad, setFirstLoad] = useState<boolean>(true);
  const navigate = useNavigate();
  const tokens = allXTokens;
  const { pair = '' } = useParams<{ pair: string }>();
  const { onCurrencySelection } = useSwapActionHandlers();
  const { currencies } = useDerivedSwapInfo();

  useEffect(() => {
    if (firstLoad && Object.values(tokens).length > 0) {
      const tokensArray = Object.values(tokens);

      const inputToken = pair.split('_')[0];
      const outputToken = pair.split('_')[1] || '';
      const [currentBase, currentBaseXChainId] = inputToken.split(':');
      const [currentQuote, currentQuoteXChainId] = outputToken.split(':');

      const quote = tokensArray.find(
        x => x.symbol.toLowerCase() === currentQuote.toLocaleLowerCase() && x.xChainId === currentQuoteXChainId,
      );
      const base = tokensArray.find(
        x => x.symbol.toLowerCase() === currentBase.toLowerCase() && x.xChainId === currentBaseXChainId,
      );
      if (quote && base) {
        onCurrencySelection(Field.INPUT, base);
        onCurrencySelection(Field.OUTPUT, quote);
      }
      setFirstLoad(false);
    }
  }, [firstLoad, tokens, onCurrencySelection, pair]);

  useEffect(() => {
    if (!firstLoad && currencies.INPUT && currencies.OUTPUT) {
      const inputXChainId = currencies.INPUT instanceof XToken ? currencies.INPUT.xChainId : undefined;
      const outputXChainId = currencies.OUTPUT instanceof XToken ? currencies.OUTPUT.xChainId : undefined;

      const inputCurrency = `${currencies.INPUT.symbol}${inputXChainId ? `:${inputXChainId}` : ''}`;
      const outputCurrency = `${currencies.OUTPUT.symbol}${outputXChainId ? `:${outputXChainId}` : ''}`;
      const newPair = `${inputCurrency}_${outputCurrency}`;

      if (pair !== newPair) {
        navigate(`/swap/${newPair}`, { replace: true });
      }
    }
  }, [currencies, pair, navigate, firstLoad]);
}

import { intentService } from '@/lib/intent';
import { useQuery } from '@tanstack/react-query';

export interface MMTrade {
  inputAmount: CurrencyAmount<XToken>;
  outputAmount: CurrencyAmount<XToken>;
  fee: CurrencyAmount<XToken>;
  executionPrice: Price<Token, Token>;
  uuid: string;
}

export enum QuoteType {
  EXACT_INPUT = 'exact_input',
  EXACT_OUTPUT = 'exact_output',
}

export function useMMTrade(
  queriedCurrencyAmount: CurrencyAmount<XToken> | undefined,
  otherCurrency: XToken | undefined,
  quoteType: QuoteType,
) {
  return useQuery<MMTrade | undefined>({
    queryKey: ['quote', queriedCurrencyAmount, otherCurrency],
    queryFn: async () => {
      if (!queriedCurrencyAmount || !otherCurrency) {
        return;
      }

      const isExactInput = quoteType === QuoteType.EXACT_INPUT;

      const res = await intentService.getQuote({
        token_src: isExactInput ? queriedCurrencyAmount.currency.address : otherCurrency.address,
        token_src_blockchain_id: isExactInput ? queriedCurrencyAmount.currency.xChainId : otherCurrency.xChainId,
        token_dst: isExactInput ? otherCurrency.address : queriedCurrencyAmount.currency.address,
        token_dst_blockchain_id: isExactInput ? otherCurrency.xChainId : queriedCurrencyAmount.currency.xChainId,
        amount: queriedCurrencyAmount.quotient,
        quote_type: quoteType,
      });

      if (res.ok) {
        const quoteAmount = CurrencyAmount.fromRawAmount(otherCurrency, BigInt(res.value.quoted_amount ?? 0));

        // For exact_input: queriedCurrencyAmount is input, quoteAmount is output
        // For exact_output: quoteAmount is input, queriedCurrencyAmount is output
        const inputAmount = isExactInput ? queriedCurrencyAmount : quoteAmount;
        const outputAmount = isExactInput ? quoteAmount : queriedCurrencyAmount;

        return {
          inputAmount,
          outputAmount,
          executionPrice: new Price({ baseAmount: inputAmount, quoteAmount: outputAmount }),
          uuid: res.value.uuid,
          fee: outputAmount.multiply(new Fraction(3, 1_000)),
        };
      }

      return;
    },
    refetchInterval: 10_000,
    enabled: !!queriedCurrencyAmount && !!otherCurrency,
  });
}

const convert = (currency: XToken | undefined, amount: CurrencyAmount<Currency> | undefined) => {
  if (!currency || !amount) {
    return;
  }
  return CurrencyAmount.fromRawAmount(
    currency,
    new BigNumber(amount.toFixed()).times(10 ** currency.wrapped.decimals).toFixed(0),
  );
};

export function useDerivedMMTradeInfo(trade: Trade<Currency, Currency, TradeType> | undefined) {
  const {
    [Field.INPUT]: { currency: inputCurrency },
    [Field.OUTPUT]: { currency: outputCurrency },
    independentField,
    typedValue,
  } = useSwapState();

  const tradeType = independentField === Field.INPUT ? QuoteType.EXACT_INPUT : QuoteType.EXACT_OUTPUT;
  const isExactInput = tradeType === QuoteType.EXACT_INPUT;

  // assume independentField is Field.Input
  const mmTradeQuery = useMMTrade(
    tryParseAmount(typedValue, isExactInput ? inputCurrency?.wrapped : outputCurrency?.wrapped),
    isExactInput ? outputCurrency?.wrapped : inputCurrency?.wrapped,
    tradeType,
  );

  // compare mmTradeQuery result and trade
  const mmTrade = mmTradeQuery.data;

  const swapOutput = convert(outputCurrency?.wrapped, trade?.outputAmount);
  const swapInput = convert(inputCurrency?.wrapped, trade?.inputAmount);

  return {
    isMMBetter: isExactInput
      ? mmTrade?.outputAmount && (swapOutput ? mmTrade.outputAmount.greaterThan(swapOutput) : true)
      : mmTrade?.inputAmount && (swapInput ? mmTrade.inputAmount.lessThan(swapInput) : true),
    trade: mmTrade,
  };
}
