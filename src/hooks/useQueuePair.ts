import { useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs, LOOP } from 'packages/BalancedJs';

import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { CurrencyAmount, Fraction } from 'types/balanced-sdk-core';
import { Pair } from 'types/balanced-v1-sdk';

import { PairState } from './useV2Pairs';

export function useQueuePair(): [PairState, Pair | null] {
  const [reserves, setReserves] = useState<
    | { reserve0: string; reserve1: string; poolId: number; totalSupply: string; queueRate: Fraction }
    | number
    | undefined
  >(PairState.LOADING);

  useEffect(() => {
    setReserves(PairState.LOADING);

    const fetchReserves = async () => {
      try {
        let stats;
        const poolId = BalancedJs.utils.POOL_IDS.sICXICX;

        try {
          stats = await bnJs.Dex.getPoolStats(poolId);
        } catch (err) {
          return undefined;
        }

        // irrelevant for queue
        // const baseReserve = new BigNumber(stats['base'], 16).toFixed();
        // const quoteReserve = new BigNumber(stats['quote'], 16).toFixed();
        const totalSupply = new BigNumber(stats['total_supply'], 16).toFixed();

        const [rateNumerator, rateDenominator] = new BigNumber(stats['price'], 16).div(LOOP).toFraction();

        setReserves({
          reserve0: totalSupply,
          reserve1: totalSupply,
          totalSupply,
          poolId: poolId,
          queueRate: new Fraction(rateNumerator.toFixed(), rateDenominator.toFixed()),
        });
      } catch (err) {
        setReserves(PairState.INVALID);
      }
    };
    fetchReserves();
  }, []);

  const ICX = SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.ICX.address].wrapped;
  const sICX = SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.sICX.address].wrapped;

  return useMemo(() => {
    const result = reserves;

    if (result === PairState.LOADING) return [PairState.LOADING, null];
    if (!result) return [PairState.NOT_EXISTS, null];

    if (typeof result === 'number') return [PairState.INVALID, null];
    const { reserve0, reserve1, poolId, totalSupply, queueRate } = result;

    return [
      PairState.EXISTS,
      new Pair(CurrencyAmount.fromRawAmount(ICX, reserve1), CurrencyAmount.fromRawAmount(sICX, reserve0), {
        queueRate,
        poolId,
        totalSupply,
      }),
    ];
  }, [reserves, ICX, sICX]);
}
