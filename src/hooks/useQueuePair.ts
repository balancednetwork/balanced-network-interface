import { useEffect, useState } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs, LOOP } from 'packages/BalancedJs';

import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { CurrencyAmount } from 'types/balanced-sdk-core';
import { Pair } from 'types/balanced-v1-sdk';

import useLastCount from './useLastCount';
import { PairState } from './useV2Pairs';

export function useQueuePair(): [PairState, Pair | null] {
  const [pair, setPair] = useState<[PairState, Pair | null]>([PairState.LOADING, null]);

  const ICX = SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.ICX.address].wrapped;
  const sICX = SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.sICX.address].wrapped;

  const last = useLastCount(10000);

  useEffect(() => {
    const fetchReserves = async () => {
      try {
        const poolId = BalancedJs.utils.POOL_IDS.sICXICX;

        const stats = await bnJs.Dex.getPoolStats(poolId);

        const rate = new BigNumber(stats['price'], 16).div(LOOP);

        const icxSupply = new BigNumber(stats['total_supply'], 16);
        const sicxSupply = icxSupply.div(rate);

        const totalSupply = icxSupply.toFixed();

        // ICX/sICX
        const newPair: [PairState, Pair] = [
          PairState.EXISTS,
          new Pair(
            CurrencyAmount.fromRawAmount(ICX, totalSupply),
            CurrencyAmount.fromRawAmount(sICX, sicxSupply.toFixed(0)),
            {
              poolId,
              totalSupply,
            },
          ),
        ];

        setPair(newPair);
      } catch (err) {
        setPair([PairState.INVALID, null]);
      }
    };
    fetchReserves();
  }, [last, ICX, sICX]);

  return pair;
}
