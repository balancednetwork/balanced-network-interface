import React, { useCallback, useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { isAddress } from 'icon-sdk-js/lib/data/Validator.js';
import JSBI from 'jsbi';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { canBeQueue, getTradePair } from 'constants/currency';
import { isBALN, isNativeCurrency, SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useSwapSlippageTolerance } from 'store/application/hooks';
import { usePools } from 'store/pool/hooks';
import { Trade } from 'types/balanced-v1-sdk';
import { parseUnits } from 'utils';

import { TradeType, Currency, CurrencyAmount, Percent, Token, NativeCurrency } from '../../types/balanced-sdk-core';
import { AppDispatch, AppState } from '../index';
import { Field, selectCurrency, selectPercent, setRecipient, switchCurrencies, typeInput } from './actions';
import { useTradeExactIn, useTradeExactOut } from './adapter';

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
  const onCurrencySelection = useCallback(
    (field: Field, currency: Currency) => {
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

export function useTokenBalances(
  account: string | undefined,
  tokens: Token[],
): { [address: string]: CurrencyAmount<Currency> | undefined } {
  const [balances, setBalances] = useState<(string | number | BigNumber)[]>([]);

  useEffect(() => {
    const fetchBalances = async () => {
      const result = await Promise.all(
        tokens.map(async token => {
          if (!account) return undefined;
          if (isBALN(token)) return bnJs.BALN.availableBalanceOf(account);
          return bnJs.getContract(token.address).balanceOf(account);
        }),
      );

      setBalances(result);
    };

    fetchBalances();
  }, [tokens, account]);

  return useMemo(() => {
    return tokens.reduce((agg, token, idx) => {
      const balance = balances[idx];

      if (balance) agg[token.address] = CurrencyAmount.fromRawAmount(token, String(balance));
      else agg[token.address] = CurrencyAmount.fromRawAmount(token, 0);

      return agg;
    }, {});
  }, [balances, tokens]);
}

export function useICXBalances(
  uncheckedAddresses: (string | undefined)[],
): { [address: string]: CurrencyAmount<Currency> | undefined } {
  const [balances, setBalances] = useState<(string | number | BigNumber)[]>([]);

  const addresses: string[] = useMemo(
    () =>
      uncheckedAddresses
        ? uncheckedAddresses
            .filter(isAddress)
            .filter((a): a is string => a !== undefined)
            .sort()
        : [],
    [uncheckedAddresses],
  );

  useEffect(() => {
    const fetchBalances = async () => {
      const result = await Promise.all(
        addresses.map(async address => {
          return bnJs.ICX.balanceOf(address);
        }),
      );

      setBalances(result);
    };

    fetchBalances();
  }, [addresses]);

  const ICX = SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.ICX.address];

  return useMemo(() => {
    return addresses.reduce((agg, address, idx) => {
      const balance = balances[idx];

      if (balance) agg[address] = CurrencyAmount.fromRawAmount(ICX, String(balance));
      else agg[address] = CurrencyAmount.fromRawAmount(ICX, 0);

      return agg;
    }, {});
  }, [balances, addresses, ICX]);
}

export function useCurrencyBalances(
  account: string | undefined,
  currencies: (Currency | undefined)[],
): (CurrencyAmount<Currency> | undefined)[] {
  const literal = useMemo(
    () =>
      currencies.reduce((agg: string, cur: Currency | undefined) => {
        if (cur instanceof Token) return `${agg}-${cur.address}`;
        if (cur instanceof NativeCurrency) return `${agg}-BASE`;
        return agg;
      }, ''),
    [currencies],
  );
  const tokens = useMemo(
    () =>
      (currencies?.filter((currency): currency is Token => currency?.isToken ?? false) ?? []).filter(
        (token: Token) => !isNativeCurrency(token),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [literal],
  );

  const tokenBalances = useTokenBalances(account, tokens);

  const containsICX: boolean = useMemo(() => currencies?.some(currency => isNativeCurrency(currency)) ?? false, [
    currencies,
  ]);
  const accounts = useMemo(() => (containsICX ? [account] : []), [containsICX, account]);
  const icxBalance = useICXBalances(accounts);

  return React.useMemo(
    () =>
      currencies.map(currency => {
        if (!account || !currency) return undefined;
        if (isNativeCurrency(currency)) return icxBalance[account];
        if (currency.isToken) return tokenBalances[currency.address];
        return undefined;
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tokenBalances, icxBalance, account, literal],
  );
}

export function useCurrencyBalance(account?: string, currency?: Currency): CurrencyAmount<Currency> | undefined {
  return useCurrencyBalances(account, [currency])[0];
}

export function usePrice(currencyIn?: string, currencyOut?: string): BigNumber | undefined {
  const pools = usePools();

  if (!currencyIn || !currencyOut) return undefined;

  const [pair, inverse] = getTradePair(currencyIn, currencyOut);

  if (!pair) return undefined;

  const pool = pools[pair.id];

  if (!pool) return undefined;

  return !inverse ? pool.rate : pool.inverseRate;
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
export function useDerivedSwapInfo(): {
  trade: Trade<Currency, Currency, TradeType> | undefined;
  currencies: { [field in Field]?: Currency };
  percents: { [field in Field]?: number };
  currencyBalances: { [field in Field]?: CurrencyAmount<Currency> | undefined };
  parsedAmount: CurrencyAmount<Currency> | undefined;
  inputError?: string;
  allowedSlippage: number;
  // FIXME: need to refactor this later. it is temporarily solution.
  price: BigNumber | undefined;
} {
  const { account } = useIconReact();

  const {
    independentField,
    typedValue,
    [Field.INPUT]: { currency: inputCurrency, percent: inputPercent },
    [Field.OUTPUT]: { currency: outputCurrency },
  } = useSwapState();

  const relevantTokenBalances = useCurrencyBalances(account ?? undefined, [
    inputCurrency ?? undefined,
    outputCurrency ?? undefined,
  ]);

  const isExactIn: boolean = independentField === Field.INPUT;
  const parsedAmount = tryParseAmount(typedValue, (isExactIn ? inputCurrency : outputCurrency) ?? undefined);

  const currencyBalances = {
    [Field.INPUT]: relevantTokenBalances[0],
    [Field.OUTPUT]: relevantTokenBalances[1],
  };

  const currencies: { [field in Field]?: Currency } = {
    [Field.INPUT]: inputCurrency ?? undefined,
    [Field.OUTPUT]: outputCurrency ?? undefined,
  };

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
    inputError = 'Connect Wallet';
  }

  if (!parsedAmount) {
    inputError = inputError ?? 'Enter amount';
  }

  if (!currencies[Field.INPUT] || !currencies[Field.OUTPUT]) {
    inputError = inputError ?? 'Select a token';
  }

  // compare input balance to max input based on version
  const allowedSlippage = useSwapSlippageTolerance();

  // !todo need to change the slippage data type
  const [balanceIn, amountIn] = [
    currencyBalances[Field.INPUT],
    trade?.maximumAmountIn(new Percent(allowedSlippage, 1000)),
  ];

  if (balanceIn && amountIn && balanceIn.lessThan(amountIn)) {
    inputError = 'Insufficient ' + currencies[Field.INPUT]?.symbol;
  }

  //
  const userHasSpecifiedInputOutput = Boolean(
    currencies[Field.INPUT] && currencies[Field.OUTPUT] && parsedAmount?.greaterThan(0),
  );

  if (userHasSpecifiedInputOutput && !trade) inputError = 'Insufficient liquidity';

  const price = usePrice(currencies[Field.INPUT]?.symbol, currencies[Field.OUTPUT]?.symbol);

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
