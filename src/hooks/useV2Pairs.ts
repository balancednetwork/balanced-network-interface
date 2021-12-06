import { useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';

import bnJs from 'bnJs';
import { Currency, CurrencyAmount } from 'types/balanced-sdk-core';
import { Pair } from 'types/balanced-v1-sdk';

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function useV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const [reserves, setReserves] = useState<({ reserve0: string; reserve1: string } | number | undefined)[]>([]);

  const tokens = useMemo(() => {
    return currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]);
  }, [currencies]);

  useEffect(() => {
    setReserves(Array(tokens.length).fill(PairState.LOADING));

    const fetchReserves = async () => {
      try {
        const result = await Promise.all(
          tokens.map(async ([tokenA, tokenB]) => {
            if (tokenA && tokenB && tokenA.chainId === tokenB.chainId && !tokenA.equals(tokenB)) {
              let stats;
              let poolId;

              try {
                poolId = await bnJs.Dex.getPoolId(tokenA.address, tokenB.address);
                stats = await bnJs.Dex.getPoolStats(poolId);
              } catch (err) {
                return undefined;
              }

              const baseReserve = new BigNumber(stats['base'], 16).toFixed();
              const quoteReserve = new BigNumber(stats['quote'], 16).toFixed();

              if (stats['base_token'] === tokenA.address) return { reserve0: baseReserve, reserve1: quoteReserve };
              else return { reserve0: quoteReserve, reserve1: baseReserve };
            } else return undefined;
          }),
        );

        setReserves(result);
      } catch (err) {
        setReserves(Array(tokens.length).fill(PairState.INVALID));
      }
    };
    fetchReserves();
  }, [tokens]);

  return useMemo(() => {
    return tokens.map((tokenArr, i) => {
      const result = reserves[i];
      const tokenA = tokenArr[0];
      const tokenB = tokenArr[1];

      if (result === PairState.LOADING) return [PairState.LOADING, null];
      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null];
      if (!result) return [PairState.NOT_EXISTS, null];

      if (typeof result === 'number') return [PairState.INVALID, null];
      const { reserve0, reserve1 } = result;
      const [token0, token1] = tokenA.sortsBefore(tokenB) ? [tokenA, tokenB] : [tokenB, tokenA];
      return [
        PairState.EXISTS,
        new Pair(CurrencyAmount.fromRawAmount(token0, reserve0), CurrencyAmount.fromRawAmount(token1, reserve1)),
      ];
    });
  }, [reserves, tokens]);
}

export function useV2Pair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB]);
  return useV2Pairs(inputs)[0];
}
