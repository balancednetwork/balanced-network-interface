import { useMemo } from 'react';

import { Currency, CurrencyAmount, TradeType } from '@balancednetwork/sdk-core';
import { Pair, Trade } from '@balancednetwork/v1-sdk';

import { useAllCurrencyCombinations } from 'hooks/useAllCurrencyCombinations';
import { PairState, useV2Pairs } from 'hooks/useV2Pairs';
import { isTradeBetter } from 'utils/isTradeBetter';

import { BETTER_TRADE_LESS_HOPS_THRESHOLD } from '../../constants/misc';
import { MAX_HOPS } from '../../constants/routing';

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const allCurrencyCombinations = useAllCurrencyCombinations(currencyA, currencyB);

  // Note: allCurrencyCombinations can be an empty array

  const allPairs = useV2Pairs(allCurrencyCombinations);

  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          .map(([, pair]) => pair),
      ),
    [allPairs],
  );
}

export function useTradeExactIn(
  currencyAmountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency,
  { maxHops = MAX_HOPS } = {},
): Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined {
  const [currencyA, currencyB] = useMemo(() => [currencyAmountIn?.currency, currencyOut], [
    currencyAmountIn,
    currencyOut,
  ]);

  const pairs = useAllCommonPairs(currencyA, currencyB);

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && pairs.length > 0) {
      if (maxHops === 1) {
        return (
          Trade.bestTradeExactIn(pairs, currencyAmountIn, currencyOut, { maxHops: 1, maxNumResults: 1 })[1]?.[0] ??
          undefined
        );
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined = undefined;
      const trades = Trade.bestTradeExactIn(pairs, currencyAmountIn, currencyOut, {
        maxHops: maxHops,
        maxNumResults: 1,
      });
      for (let i = 1; i <= maxHops; i++) {
        const currentTrade: Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined = trades[i]?.[0] ?? undefined;
        // if current trade is best yet, save it
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade;
        }
      }
      return bestTradeSoFar;
    }

    return undefined;
  }, [pairs, currencyAmountIn, currencyOut, maxHops]);
}

export function useTradeExactOut(
  currencyIn?: Currency,
  currencyAmountOut?: CurrencyAmount<Currency>,
  { maxHops = MAX_HOPS } = {},
): Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | undefined {
  const [currencyA, currencyB] = useMemo(() => [currencyIn, currencyAmountOut?.currency], [
    currencyIn,
    currencyAmountOut,
  ]);

  const pairs = useAllCommonPairs(currencyA, currencyB);

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && pairs.length > 0) {
      if (maxHops === 1) {
        return (
          Trade.bestTradeExactOut(pairs, currencyIn, currencyAmountOut, { maxHops: 1, maxNumResults: 1 })[1]?.[0] ??
          undefined
        );
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | undefined = undefined;
      const trades = Trade.bestTradeExactOut(pairs, currencyIn, currencyAmountOut, {
        maxHops: maxHops,
        maxNumResults: 1,
      });
      for (let i = 1; i <= maxHops; i++) {
        const currentTrade: Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | undefined = trades[i]?.[0] ?? undefined;
        // if current trade is best yet, save it
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade;
        }
      }
      return bestTradeSoFar;
    }

    return undefined;
  }, [pairs, currencyIn, currencyAmountOut, maxHops]);
}
