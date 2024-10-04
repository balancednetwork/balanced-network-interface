import { useCallback, useEffect, useMemo, useState } from 'react';

import { Currency, CurrencyAmount, Price, Token, TradeType, XChainId, XToken } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { t } from '@lingui/macro';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { canBeQueue } from '@/constants/currency';
import { SLIPPAGE_SWAP_DISABLED_THRESHOLD } from '@/constants/misc';
import { useAssetManagerTokens } from '@/hooks/useAssetManagerTokens';
import { PairState, useV2Pair } from '@/hooks/useV2Pairs';
import { useSwapSlippageTolerance } from '@/store/application/hooks';
import { useWalletBalances } from '@/store/wallet/hooks';
import { parseUnits } from '@/utils';
import { getXAddress, getXTokenBySymbol } from '@/utils/xTokens';
import { getXChainType } from '@/xwagmi/actions';
import { allXTokens } from '@/xwagmi/constants/xTokens';
import { useXAccount } from '@/xwagmi/hooks';
import BigNumber from 'bignumber.js';
import { AppDispatch, AppState } from '../index';
import { Field, selectCurrency, selectPercent, setRecipient, switchCurrencies, typeInput } from './reducer';
import { useTradeExactIn, useTradeExactOut } from './trade';
import { XTransactionType } from '@/xwagmi/xcall/types';

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap);
}

const calculateXTransactionType = (
  token1: XToken | undefined,
  token2: XToken | undefined,
): XTransactionType | undefined => {
  if (!token1 || !token2) return undefined;

  if (token1.xChainId === token2.xChainId && token2.xChainId === '0x1.icon') {
    return XTransactionType.SWAP_ON_ICON;
  } else if (token1.symbol === token2.symbol) {
    // TODO: check if this check is correct
    return XTransactionType.BRIDGE;
  } else {
    return XTransactionType.SWAP;
  }
};

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

// try to parse a user entered amount for a given token
export function tryParseAmount(value?: string, currency?: XToken): CurrencyAmount<XToken> | undefined {
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
  account: string | undefined;
  trade: Trade<Currency, Currency, TradeType> | undefined;
  currencies: { [field in Field]?: XToken };
  percents: { [field in Field]?: number };
  currencyBalances: { [field in Field]?: CurrencyAmount<XToken> | undefined };
  parsedAmount: CurrencyAmount<XToken> | undefined;
  inputError?: string;
  allowedSlippage: number;
  price: Price<Token, Token> | undefined;
  direction: {
    from: XChainId;
    to: XChainId;
  };
  dependentField: Field;
  formattedAmounts: {
    [field in Field]: string;
  };
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

  const xAccount = useXAccount(getXChainType(inputXChainId));
  const account = xAccount.address;

  const walletBalances = useWalletBalances();

  const isExactIn: boolean = independentField === Field.INPUT;
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined);
  const currencyBalances: { [field in Field]?: CurrencyAmount<XToken> } = useMemo(
    () => ({
      [Field.INPUT]: inputCurrency ? walletBalances?.[inputCurrency?.wrapped.address] : undefined,
      [Field.OUTPUT]: outputCurrency ? walletBalances?.[outputCurrency?.wrapped.address] : undefined,
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

  const _parsedAmount = tryParseAmount(
    typedValue,
    (isExactIn ? _inputCurrencyOnIcon : _outputCurrencyOnIcon) ?? undefined,
  );
  // cannot call `useTradeExactIn` or `useTradeExactOut` conditionally because they are hooks
  const queue = canBeQueue(_inputCurrencyOnIcon, _outputCurrencyOnIcon);

  const trade1 = useTradeExactIn(isExactIn ? _parsedAmount : undefined, _outputCurrencyOnIcon, {
    maxHops: queue ? 1 : undefined,
  });
  const trade2 = useTradeExactOut(_inputCurrencyOnIcon, !isExactIn ? _parsedAmount : undefined, {
    maxHops: queue ? 1 : undefined,
  });
  const trade = useMemo(() => (isExactIn ? trade1 : trade2), [isExactIn, trade1, trade2]);

  const allowedSlippage = useSwapSlippageTolerance();
  const inputError = useMemo(() => {
    const swapDisabled = trade?.priceImpact.greaterThan(SLIPPAGE_SWAP_DISABLED_THRESHOLD);

    let error: string | undefined;

    if (account) {
      if (!recipient) {
        error = t`Choose address`;
      } else if (!parsedAmount) {
        error = t`Enter amount`;
      } else if (swapDisabled) {
        error = t`Reduce price impact`;
      }
    }

    if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
      error = error ?? t`Select a token`;
    }

    const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade?.inputAmount];

    if (balanceIn && amountIn && new BigNumber(balanceIn.toFixed()).isLessThan(amountIn.toFixed())) {
      error = t`Insufficient ${currencies[Field.INPUT]?.symbol}`;
    }

    const userHasSpecifiedInputOutput = Boolean(
      currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmount?.greaterThan(0),
    );

    if (userHasSpecifiedInputOutput && !trade) {
      error = t`Insufficient liquidity`;
    }

    return error;
  }, [account, recipient, parsedAmount, currencies, currencyBalances, trade]);

  const [pairState, pair] = useV2Pair(_inputCurrencyOnIcon, _outputCurrencyOnIcon);
  const price = useMemo(() => {
    let price: Price<Token, Token> | undefined;
    if (pair && pairState === PairState.EXISTS && _inputCurrencyOnIcon) {
      if (pair.involvesToken(_inputCurrencyOnIcon.wrapped)) {
        price = pair.priceOf(_inputCurrencyOnIcon.wrapped);
      } else {
        price = pair.token0Price; // pair not ready, just set dummy price
      }
    }
    return price;
  }, [pair, pairState, _inputCurrencyOnIcon]);

  const direction = useMemo(
    () => ({ from: inputXChainId || '0x1.icon', to: outputXChainId || '0x1.icon' }),
    [inputXChainId, outputXChainId],
  );

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const parsedAmounts = useMemo(
    () => ({
      [Field.INPUT]: independentField === Field.INPUT ? parsedAmount : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? parsedAmount : trade?.outputAmount,
    }),
    [independentField, parsedAmount, trade],
  );

  const formattedAmounts = useMemo(() => {
    return {
      [independentField]: typedValue,
      [dependentField]: parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    } as { [field in Field]: string };
  }, [dependentField, independentField, parsedAmounts, typedValue]);

  const { data: assetManager } = useAssetManagerTokens();

  const maximumBridgeAmount = useMemo(() => {
    if (currencies[Field.OUTPUT] instanceof XToken) {
      return assetManager?.[getXAddress(currencies[Field.OUTPUT]) ?? '']?.depositedAmount;
    }
  }, [assetManager, currencies[Field.OUTPUT]]);

  const outputCurrencyAmount = useMemo(() => {
    if (outputCurrency && formattedAmounts[Field.OUTPUT] && !Number.isNaN(parseFloat(formattedAmounts[Field.OUTPUT]))) {
      return CurrencyAmount.fromRawAmount(
        outputCurrency,
        new BigNumber(formattedAmounts[Field.OUTPUT]).times(10 ** outputCurrency.wrapped.decimals).toFixed(0),
      );
    }
    return undefined;
  }, [formattedAmounts[Field.OUTPUT], outputCurrency]);

  const canBridge = useMemo(() => {
    return maximumBridgeAmount && outputCurrencyAmount ? maximumBridgeAmount?.greaterThan(outputCurrencyAmount) : true;
  }, [maximumBridgeAmount, outputCurrencyAmount]);

  const xTransactionType = useMemo(() => {
    return calculateXTransactionType(inputCurrency, outputCurrency);
  }, [inputCurrency, outputCurrency]);

  return {
    account,
    trade,
    currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    allowedSlippage,
    percents,
    price,
    direction,
    dependentField,
    formattedAmounts,
    canBridge,
    maximumBridgeAmount,
    xTransactionType,
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
