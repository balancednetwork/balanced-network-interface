import { useMemo } from 'react';

import { PairInfo, SUPPORTED_PAIRS } from '../../constants/pairs';
import { BETTER_TRADE_LESS_HOPS_THRESHOLD, DEFAULT_MAX_HOPS, LIMIT_MAX_HOPS } from '../../constants/routing';
import { Pool } from '../../types';
import { convertPair } from '../../types/adapter';
import { Currency, CurrencyAmount, TradeType } from '../../types/balanced-sdk-core';
import { Pair, Trade } from '../../types/balanced-v1-sdk/entities';
import { isTradeBetter } from '../../types/balanced-v1-sdk/utils/isTradeBetter';
import { usePools } from '../pool/hooks';

export function getPool(pools: { [p: string]: Pool }, pairInfo: PairInfo) {
  if (pairInfo.id === undefined) return undefined;

  const pool = pools[pairInfo.id];

  if (!pool) return undefined;

  return pool;
}

function getPairs(pools: { [p: string]: Pool }) {
  const pairs = SUPPORTED_PAIRS.map((pairInfo: PairInfo) => convertPair(getPool(pools, pairInfo)));
  return pairs.filter((pair?: Pair): pair is Pair => !!pair);
}

export function useTradeExactIn(
  currencyAmountIn?: CurrencyAmount<Currency>,
  currencyOut?: Currency,
  { maxHops = DEFAULT_MAX_HOPS } = {},
): Trade<Currency, Currency, TradeType.EXACT_INPUT> | undefined {
  if (maxHops > LIMIT_MAX_HOPS) maxHops = LIMIT_MAX_HOPS;

  const pools = usePools();

  const pairs = getPairs(pools);

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
  { maxHops = DEFAULT_MAX_HOPS } = {},
): Trade<Currency, Currency, TradeType.EXACT_OUTPUT> | undefined {
  if (maxHops > LIMIT_MAX_HOPS) maxHops = LIMIT_MAX_HOPS;

  const pools = usePools();

  const pairs = getPairs(pools);

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
