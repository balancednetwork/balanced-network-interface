import React, { useCallback, useEffect, useMemo } from 'react';

import { Currency, CurrencyAmount, Price, Token, TradeType } from '@balancednetwork/sdk-core';
import { Trade } from '@balancednetwork/v1-sdk';
import { t } from '@lingui/macro';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';

import { canBeQueue } from '@/constants/currency';
import { SLIPPAGE_SWAP_DISABLED_THRESHOLD } from '@/constants/misc';
import { useAllXTokens } from '@/hooks/Tokens';
import { useAssetManagerTokens } from '@/hooks/useAssetManagerTokens';
import { PairState, useV2Pair } from '@/hooks/useV2Pairs';
import { useCrossChainWalletBalances } from '@/store/wallet/hooks';
import { parseUnits } from '@/utils';
import { getXTokenBySymbol } from '@/utils/xTokens';
import { getXChainType } from '@/xwagmi/actions';
import { useXAccount } from '@/xwagmi/hooks';
import { XChainId, XToken } from '@/xwagmi/types';
import BigNumber from 'bignumber.js';
import { AppDispatch, AppState } from '../index';
import {
  Field,
  selectChain,
  selectCurrency,
  selectPercent,
  setRecipient,
  switchCurrencies,
  typeInput,
} from './reducer';
import { useTradeExactIn, useTradeExactOut } from './trade';

export function useSwapState(): AppState['swap'] {
  return useSelector<AppState, AppState['swap']>(state => state.swap);
}

export function useSwapActionHandlers() {
  const dispatch = useDispatch<AppDispatch>();

  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
      dispatch(
        selectCurrency({
          field,
          currency: XToken.getXToken('0x1.icon', currency.wrapped),
        }),
      );
    },
    [dispatch],
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
    onChainSelection,
  };
}

// try to parse a user entered amount for a given token
export function tryParseAmount<T extends Currency>(value?: string, currency?: T): CurrencyAmount<T> | undefined {
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
  _currencies: { [field in Field]?: Currency };
  percents: { [field in Field]?: number };
  currencyBalances: { [field in Field]?: CurrencyAmount<XToken> | undefined };
  parsedAmount: CurrencyAmount<Currency> | undefined;
  inputError?: string;
  price: Price<Token, Token> | undefined;
  direction: { from: XChainId; to: XChainId };
  dependentField: Field;
  parsedAmounts: {
    [field in Field]: CurrencyAmount<XToken> | undefined;
  };
  formattedAmounts: {
    [field in Field]: string;
  };
  canBridge: boolean;
  maximumBridgeAmount: CurrencyAmount<XToken> | undefined;
} {
  const {
    independentField,
    typedValue,
    recipient,
    [Field.INPUT]: { currency: inputCurrency, percent: inputPercent },
    [Field.OUTPUT]: { currency: outputCurrency },
  } = useSwapState();

  const account = useXAccount(getXChainType(inputCurrency?.xChainId)).address;

  const crossChainWallet = useCrossChainWalletBalances();

  const isExactIn: boolean = independentField === Field.INPUT;
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined);
  const currencyBalances: { [field in Field]?: CurrencyAmount<XToken> } = React.useMemo(() => {
    return {
      [Field.INPUT]: inputCurrency
        ? crossChainWallet[inputCurrency.xChainId]?.[inputCurrency?.wrapped.address]
        : undefined,
      [Field.OUTPUT]: outputCurrency
        ? crossChainWallet[outputCurrency.xChainId]?.[outputCurrency?.wrapped.address]
        : undefined,
    };
  }, [crossChainWallet, inputCurrency, outputCurrency]);

  const currencies: { [field in Field]?: XToken } = useMemo(() => {
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

  const _currencies: { [field in Field]?: Currency } = useMemo(() => {
    return {
      [Field.INPUT]: getXTokenBySymbol('0x1.icon', inputCurrency?.symbol),
      [Field.OUTPUT]: getXTokenBySymbol('0x1.icon', outputCurrency?.symbol),
    };
  }, [inputCurrency, outputCurrency]);
  const _parsedAmount = tryParseAmount(
    typedValue,
    (isExactIn ? _currencies[Field.INPUT] : _currencies[Field.OUTPUT]) ?? undefined,
  );
  // cannot call `useTradeExactIn` or `useTradeExactOut` conditionally because they are hooks
  const queue = canBeQueue(_currencies[Field.INPUT], _currencies[Field.OUTPUT]);
  const trade1 = useTradeExactIn(isExactIn ? _parsedAmount : undefined, _currencies[Field.OUTPUT], {
    maxHops: queue ? 1 : undefined,
  });
  const trade2 = useTradeExactOut(_currencies[Field.INPUT], !isExactIn ? _parsedAmount : undefined, {
    maxHops: queue ? 1 : undefined,
  });
  const trade = isExactIn ? trade1 : trade2;
  const swapDisabled = trade?.priceImpact.greaterThan(SLIPPAGE_SWAP_DISABLED_THRESHOLD);

  let inputError: string | undefined;
  if (account && !recipient) {
    inputError = t`Choose address`;
  }

  if (account && !parsedAmount) {
    inputError = t`Enter amount`;
  }

  if (account && swapDisabled) {
    inputError = t`Reduce price impact`;
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? t`Select a token`;
  }

  const [balanceIn, amountIn] = [currencyBalances[Field.INPUT], trade?.inputAmount];

  // decimal scales are different for different chains for the same token
  if (balanceIn && amountIn && new BigNumber(balanceIn.toFixed()).isLessThan(amountIn.toFixed())) {
    inputError = t`Insufficient ${currencies[Field.INPUT]?.symbol}`;
  }

  //
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmount?.greaterThan(0),
  );

  if (userHasSpecifiedInputOutput && !trade) inputError = t`Insufficient liquidity`;

  const [pairState, pair] = useV2Pair(_currencies[Field.INPUT], _currencies[Field.OUTPUT]);

  let price: Price<Token, Token> | undefined;
  if (pair && pairState === PairState.EXISTS && _currencies[Field.INPUT]) {
    if (pair.involvesToken(_currencies[Field.INPUT].wrapped)) price = pair.priceOf(_currencies[Field.INPUT].wrapped);
    else price = pair.token0Price; // pair not ready, just set dummy price
  }

  const dependentField: Field = independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT;

  const _parsedAmounts = React.useMemo(
    () => ({
      [Field.INPUT]: independentField === Field.INPUT ? _parsedAmount : trade?.inputAmount,
      [Field.OUTPUT]: independentField === Field.OUTPUT ? _parsedAmount : trade?.outputAmount,
    }),
    [independentField, _parsedAmount, trade],
  );

  const formattedAmounts = React.useMemo(() => {
    return {
      [independentField]: typedValue,
      [dependentField]: _parsedAmounts[dependentField]?.toSignificant(6) ?? '',
    } as { [field in Field]: string };
  }, [dependentField, independentField, _parsedAmounts, typedValue]);

  const parsedAmounts = React.useMemo(() => {
    return {
      [independentField]: parsedAmount,
      [dependentField]:
        currencies[dependentField] && formattedAmounts[dependentField]
          ? CurrencyAmount.fromRawAmount(
              currencies[dependentField],
              new BigNumber(formattedAmounts[dependentField])
                .times(10 ** currencies[dependentField].wrapped.decimals)
                .toFixed(0),
            )
          : undefined,
    } as { [field in Field]: CurrencyAmount<XToken> | undefined };
  }, [parsedAmount, currencies, dependentField, formattedAmounts, independentField]);

  const { data: assetManager } = useAssetManagerTokens();

  const maximumBridgeAmount = useMemo(() => {
    if (currencies[Field.OUTPUT] instanceof XToken) {
      return assetManager?.[currencies[Field.OUTPUT].id ?? '']?.depositedAmount;
    }
  }, [assetManager, currencies[Field.OUTPUT]]);

  const outputCurrencyAmount = parsedAmounts[Field.OUTPUT];

  const canBridge = useMemo(() => {
    return maximumBridgeAmount && outputCurrencyAmount ? maximumBridgeAmount?.greaterThan(outputCurrencyAmount) : true;
  }, [maximumBridgeAmount, outputCurrencyAmount]);

  const direction = {
    from: currencies[Field.INPUT]?.xChainId || '0x1.icon',
    to: currencies[Field.OUTPUT]?.xChainId || '0x1.icon',
  };

  return {
    account,
    trade,
    currencies,
    _currencies,
    currencyBalances,
    parsedAmount,
    inputError,
    percents,
    price,
    direction,
    dependentField,
    parsedAmounts,
    formattedAmounts,
    canBridge,
    maximumBridgeAmount,
  };
}

export function useInitialSwapLoad(): void {
  const [firstLoad, setFirstLoad] = React.useState<boolean>(true);
  const navigate = useNavigate();
  const tokens = useAllXTokens();
  const { pair = '' } = useParams<{ pair: string }>();
  const { onCurrencySelection } = useSwapActionHandlers();
  const { currencies } = useDerivedSwapInfo();

  useEffect(() => {
    if (firstLoad && Object.values(tokens).length > 0) {
      const tokensArray = Object.values(tokens);

      const inputToken = pair.split('_')[0] || '';
      const outputToken = pair.split('_')[1] || '';
      const [currentBase, currentBaseXChainId] = inputToken.split(':');
      const [currentQuote, currentQuoteXChainId] = outputToken.split(':');

      const quote = tokensArray.find(
        x => x.symbol.toLowerCase() === currentQuote.toLowerCase() && x.xChainId === currentQuoteXChainId,
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
        navigate(`/trade/${newPair}`, { replace: true });
      }
    }
  }, [currencies, pair, navigate, firstLoad]);
}

import { IntentService } from '@balancednetwork/intents-sdk';
import { useQuery } from '@tanstack/react-query';

export interface MMTrade {
  inputAmount: CurrencyAmount<XToken>;
  outputAmount: CurrencyAmount<XToken>;
  executionPrice: Price<Token, Token>;
  uuid: string;
}

export function useMMTrade(inputAmount: CurrencyAmount<XToken> | undefined, outputCurrency: XToken | undefined) {
  return useQuery<MMTrade | undefined>({
    queryKey: ['quote', inputAmount, outputCurrency],
    queryFn: async () => {
      if (!inputAmount || !outputCurrency) {
        return;
      }

      const res = await IntentService.getQuote({
        token_src: inputAmount.currency.address,
        token_src_blockchain_id: inputAmount.currency.xChainId,
        token_dst: outputCurrency.address,
        token_dst_blockchain_id: outputCurrency.xChainId,
        src_amount: inputAmount.quotient,
      });

      if (res.ok) {
        const outputAmount = CurrencyAmount.fromRawAmount(
          outputCurrency,
          BigInt(res.value.output.expected_output ?? 0),
        );
        return {
          inputAmount: inputAmount,
          outputAmount: outputAmount,
          executionPrice: new Price({ baseAmount: inputAmount, quoteAmount: outputAmount }),
          uuid: res.value.output.uuid,
        };
      }

      return;
    },
    refetchInterval: 10_000,
    enabled: !!inputAmount && !!outputCurrency,
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

  // assume independentField is Field.Input
  const mmTradeQuery = useMMTrade(
    independentField === Field.INPUT ? tryParseAmount(typedValue, inputCurrency) : undefined,
    outputCurrency,
  );

  // compare mmTradeQuery result and trade
  const mmTrade = mmTradeQuery.data;

  const swapOutput = convert(outputCurrency, trade?.outputAmount);

  return {
    isMMBetter: mmTrade?.outputAmount && swapOutput && mmTrade.outputAmount.greaterThan(swapOutput),
    trade: mmTrade,
  };
}
