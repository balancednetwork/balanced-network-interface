import { useMemo } from 'react';

import { Currency, Token } from '@balancednetwork/sdk-core';

import { ADDITIONAL_BASES, BASES_TO_CHECK_TRADES_AGAINST, CUSTOM_BASES } from '../constants/routing';

export function getAllCurrencyCombinations(currencyA?: Currency, currencyB?: Currency): [Token, Token][] {
  const chainId = currencyA?.chainId;
  const [tokenA, tokenB] = chainId ? [currencyA?.wrapped, currencyB?.wrapped] : [undefined, undefined];

  const getBases = (chainId: string | number | undefined, tokenA?: Token, tokenB?: Token): Token[] => {
    if (!chainId || chainId !== tokenB?.chainId) return [];

    const commonBases = BASES_TO_CHECK_TRADES_AGAINST[chainId] ?? [];
    const additionalBasesA = tokenA ? ADDITIONAL_BASES[chainId]?.[tokenA.address] ?? [] : [];
    const additionalBasesB = tokenB ? ADDITIONAL_BASES[chainId]?.[tokenB.address] ?? [] : [];

    return [...commonBases, ...additionalBasesA, ...additionalBasesB];
  };

  const bases = getBases(chainId, tokenA, tokenB);

  const getBasePairs = (bases: Token[]): [Token, Token][] => {
    return bases
      .flatMap((base): [Token, Token][] => bases.map(otherBase => [base, otherBase]))
      .filter(([t0, t1]) => !t0.equals(t1));
  };

  const basePairs = getBasePairs(bases);

  const getAllPairs = (
    tokenA: Token | undefined,
    tokenB: Token | undefined,
    bases: Token[],
    basePairs: [Token, Token][],
    chainId: string | number | undefined,
  ): [Token, Token][] => {
    if (!tokenA || !tokenB) return [];

    const directPair: [Token, Token] = [tokenA, tokenB];
    const tokenABasePairs = bases.map((base): [Token, Token] => [tokenA, base]);
    const tokenBBasePairs = bases.map((base): [Token, Token] => [tokenB, base]);

    const pairs = [directPair, ...tokenABasePairs, ...tokenBBasePairs, ...basePairs];

    return pairs
      .filter(([t0, t1]) => !t0.equals(t1))
      .filter((pair, index, self) => {
        const firstOccurrenceIndex = self.findIndex(
          ([t0, t1]) => (pair[0].equals(t0) && pair[1].equals(t1)) || (pair[0].equals(t1) && pair[1].equals(t0)),
        );
        return firstOccurrenceIndex === index;
      })
      .filter(([tA, tB]) => {
        if (!chainId) return true;

        const customBases = CUSTOM_BASES[chainId];
        const customBasesA = customBases?.[tA.address];
        const customBasesB = customBases?.[tB.address];

        if (!customBasesA && !customBasesB) return true;
        if (customBasesA && !customBasesA.some(base => tB.equals(base))) return false;
        if (customBasesB && !customBasesB.some(base => tA.equals(base))) return false;

        return true;
      });
  };

  return getAllPairs(tokenA, tokenB, bases, basePairs, chainId);
}

export function useAllCurrencyCombinations(currencyA?: Currency, currencyB?: Currency): [Token, Token][] {
  return useMemo(() => getAllCurrencyCombinations(currencyA, currencyB), [currencyA, currencyB]);
}
