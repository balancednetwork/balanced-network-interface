import { useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';

import bnJs from 'bnJs';
import { canBeQueue } from 'constants/currency';
import { Currency, CurrencyAmount, Token } from 'types/balanced-sdk-core';
import { Pair } from 'types/balanced-v1-sdk';

import useLastCount from './useLastCount';
import { useQueuePair } from './useQueuePair';

const NON_EXISTENT_POOL_ID = 0;

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export function useV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): [PairState, Pair | null][] {
  const tokens = useMemo(() => {
    return currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]);
  }, [currencies]);

  const [pairs, setPairs] = useState<[PairState, Pair | null][]>(Array(tokens.length).fill([PairState.LOADING, null]));

  const last = useLastCount(10000);

  useEffect(() => {
    setPairs(Array(tokens.length).fill([PairState.LOADING, null]));
  }, [tokens]);

  const queuePair = useQueuePair();

  useEffect(() => {
    const fetchReserves = async () => {
      try {
        const result = await Promise.all(
          tokens.map(
            async ([tokenA, tokenB]): Promise<[PairState, Pair | null]> => {
              if (tokenA && tokenB && tokenA.chainId === tokenB.chainId && !tokenA.equals(tokenB)) {
                if (canBeQueue(tokenA, tokenB))
                  return [
                    PairState.EXISTS,
                    new Pair(CurrencyAmount.fromRawAmount(tokenA, 0), CurrencyAmount.fromRawAmount(tokenB, 0), {
                      poolId: BalancedJs.utils.POOL_IDS.sICXICX,
                    }),
                  ];

                try {
                  const stats = await bnJs.Multicall.getPoolStatsForPair(tokenA.address, tokenB.address);
                  const poolId = parseInt(stats['id'], 16);
                  if (poolId === 0) return [PairState.NOT_EXISTS, null];

                  const baseReserve = new BigNumber(stats['base'], 16).toFixed();
                  const quoteReserve = new BigNumber(stats['quote'], 16).toFixed();
                  const totalSupply = new BigNumber(stats['total_supply'], 16).toFixed();

                  const [reserveA, reserveB] =
                    stats['base_token'] === tokenA.address ? [baseReserve, quoteReserve] : [quoteReserve, baseReserve];

                  return [
                    PairState.EXISTS,
                    new Pair(
                      CurrencyAmount.fromRawAmount(tokenA, reserveA),
                      CurrencyAmount.fromRawAmount(tokenB, reserveB),
                      {
                        poolId,
                        totalSupply,
                        baseAddress: stats['base_token'],
                      },
                    ),
                  ];
                } catch (err) {
                  return [PairState.NOT_EXISTS, null];
                }
              } else {
                return [PairState.INVALID, null];
              }
            },
          ),
        );

        setPairs(result);
      } catch (err) {
        setPairs(Array(tokens.length).fill([PairState.INVALID, null]));
      }
    };
    fetchReserves();
  }, [tokens, last]);

  return useMemo(() => {
    return pairs.map(pair => {
      if (pair[1] && pair[1].poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
        return queuePair;
      } else {
        return pair;
      }
    });
  }, [queuePair, pairs]);
}

export function useV2Pair(tokenA?: Currency, tokenB?: Currency): [PairState, Pair | null] {
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB]);
  return useV2Pairs(inputs)[0];
}

export function useAvailablePairs(
  currencies: [Currency | undefined, Currency | undefined][],
): { [poolId: number]: Pair } {
  const reserves = useV2Pairs(currencies);

  return useMemo<{ [poolId: number]: Pair }>(() => {
    return reserves.reduce((acc, ps) => {
      const pairState = ps[0];
      const pair = ps[1];
      const poolId = pair?.poolId;

      if (pairState === PairState.EXISTS && pair && poolId && poolId > NON_EXISTENT_POOL_ID) {
        acc[poolId] = pair;
      }

      return acc;
    }, {});
  }, [reserves]);
}

export interface BalanceData {
  poolId: number;

  // liquidity balance or ICX balance
  balance: CurrencyAmount<Token>;

  // sICX balance
  balance1?: CurrencyAmount<Token>;
}

export function useBalances(
  account: string | null | undefined,
  pools: { [poolId: number]: Pair },
): { [poolId: number]: BalanceData } {
  const [balances, setBalances] = useState<(BalanceData | undefined)[]>([]);

  const last = useLastCount(10000);

  useEffect(() => {
    async function fetchBalances() {
      if (!account) return;

      const balances = await Promise.all(
        Object.keys(pools).map(async poolId => {
          const pool = pools[+poolId];

          if (!pool) return;

          if (+poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
            const [balance, balance1] = await Promise.all([
              bnJs.Dex.getICXBalance(account),
              bnJs.Dex.getSicxEarnings(account),
            ]);

            return {
              poolId: +poolId,
              balance: CurrencyAmount.fromRawAmount(pool.token0, new BigNumber(balance, 16).toFixed()),
              balance1: CurrencyAmount.fromRawAmount(pool.token1, new BigNumber(balance1, 16).toFixed()),
            };
          } else {
            const balance = await bnJs.Dex.balanceOf(account, +poolId);

            return {
              poolId: +poolId,
              balance: CurrencyAmount.fromRawAmount(pool.liquidityToken, new BigNumber(balance, 16).toFixed()),
            };
          }
        }),
      );

      setBalances(balances);
    }

    fetchBalances();
  }, [account, pools, last]);

  return useMemo(() => {
    return balances.reduce((acc, curr) => {
      if (curr && curr.poolId > 0) acc[curr.poolId] = curr;
      return acc;
    }, {});
  }, [balances]);
}
