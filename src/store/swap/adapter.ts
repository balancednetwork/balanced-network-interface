import { useMemo } from 'react';

import { getTradePair } from '../../constants/currency';
import { PairInfo, SUPPORTED_PAIRS } from '../../constants/pairs';
import { BETTER_TRADE_LESS_HOPS_THRESHOLD, MAX_HOPS } from '../../constants/routing';
import { Pool } from '../../types';
import { convertPair } from '../../types/adapter';
import { Currency, CurrencyAmount, TradeType } from '../../types/balanced-sdk-core';
import { Pair, Trade } from '../../types/balanced-v1-sdk/entities';
import { isTradeBetter } from '../../types/balanced-v1-sdk/utils/isTradeBetter';
import { usePools } from '../pool/hooks';

export function getPool(pools: { [p: string]: Pool }, pairInfo: PairInfo) {
  const currencyIn = pairInfo.baseCurrencyKey;
  const currencyOut = pairInfo.quoteCurrencyKey;

  if (!currencyIn || !currencyOut) return undefined;

  const [pair] = getTradePair(currencyIn, currencyOut);

  if (!pair) return undefined;

  // possible to use `pairInfo.id` directly than pairInfo to get pool
  const pool = pools[pair.id];

  if (!pool) return undefined;

  return pool;
}

function getPairs(pools: { [p: string]: Pool }) {
  const pairs = SUPPORTED_PAIRS.map((pairInfo: PairInfo) => convertPair(pairInfo, getPool(pools, pairInfo)));
  return pairs.filter((pair?: Pair): pair is Pair => !!pair);
}

export function useTradeExactIn(
  currencyAmountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency,
  { maxHops = MAX_HOPS } = {},
): Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined {
  const pools = usePools();

  const pairs = getPairs(pools);

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && pairs.length > 0) {
      if (maxHops === 1) {
        return (
          Trade.bestTradeExactIn(pairs, currencyAmountIn, currencyOut, { maxHops: 1, maxNumResults: 1 })[0] ?? undefined
        );
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined = undefined;
      for (let i = 1; i <= maxHops; i++) {
        const currentTrade: Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined =
          Trade.bestTradeExactIn(pairs, currencyAmountIn, currencyOut, { maxHops: i, maxNumResults: 1 })[0] ??
          undefined;
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
  const pools = usePools();

  const pairs = getPairs(pools);

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && pairs.length > 0) {
      if (maxHops === 1) {
        return (
          Trade.bestTradeExactOut(pairs, currencyIn, currencyAmountOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          undefined
        );
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | undefined = undefined;
      for (let i = 1; i <= maxHops; i++) {
        const currentTrade: Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | undefined =
          Trade.bestTradeExactOut(pairs, currencyIn, currencyAmountOut, { maxHops: i, maxNumResults: 1 })[0] ??
          undefined;
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
