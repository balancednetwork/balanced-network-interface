import { useEffect, useMemo, useRef, useState } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';

import bnJs from 'bnJs';
import { canBeQueue } from 'constants/currency';
import { useBlockNumber } from 'store/application/hooks';
import { Currency, CurrencyAmount, Token } from 'types/balanced-sdk-core';
import { Pair } from 'types/balanced-v1-sdk';

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

  const lastBlockNumber = useBlockNumber();

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
                  const poolId = parseInt(await bnJs.Dex.getPoolId(tokenA.address, tokenB.address), 16);
                  if (poolId === 0) return [PairState.NOT_EXISTS, null];
                  const stats = await bnJs.Dex.getPoolStats(poolId);

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
  }, [tokens, lastBlockNumber]);

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

interface PoolIdData {
  poolId: number;
  token0: Token;
  token1: Token;
}

export function usePoolIds(currencies: [Currency | undefined, Currency | undefined][]): (PoolIdData | null)[] {
  const [ids, setIds] = useState<(PoolIdData | null)[]>([]);

  const tokens = useMemo(() => {
    return currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]);
  }, [currencies]);

  useEffect(() => {
    setIds(Array(tokens.length).fill(null));

    const fetchIds = async () => {
      try {
        const result = await Promise.all(
          tokens.map(async ([token0, token1]) => {
            if (token0 && token1 && token0.chainId === token1.chainId && !token0.equals(token1)) {
              if (canBeQueue(token0, token1)) return { poolId: BalancedJs.utils.POOL_IDS.sICXICX, token0, token1 };
              try {
                const poolId = parseInt(await bnJs.Dex.getPoolId(token0.address, token1.address), 16);
                return { poolId, token0, token1 };
              } catch (err) {
                return null;
              }
            } else return null;
          }),
        );

        setIds(result);
      } catch (err) {
        setIds(Array(tokens.length).fill(null));
      }
    };
    fetchIds();
  }, [tokens]);

  return ids;
}

export function useReserves(poolIds: PoolIdData[]): [PairState, Pair | null][] {
  const [reserves, setReserves] = useState<[PairState, Pair | null][]>([]);

  // const lastBlockNumber = useBlockNumber();

  useEffect(() => {
    setReserves(Array(poolIds.length).fill([PairState.LOADING, null]));

    const fetchReserves = async () => {
      try {
        const result = await Promise.all(
          poolIds.map(
            async (poolIdData): Promise<[PairState, Pair | null]> => {
              try {
                const { poolId, token0, token1 } = poolIdData;

                if (poolId === BalancedJs.utils.POOL_IDS.sICXICX)
                  return [
                    PairState.LOADING,
                    new Pair(CurrencyAmount.fromRawAmount(token0, 0), CurrencyAmount.fromRawAmount(token1, 0), {
                      poolId,
                    }),
                  ];

                const stats = await bnJs.Dex.getPoolStats(poolId);

                const baseReserve = new BigNumber(stats['base'], 16).toFixed();
                const quoteReserve = new BigNumber(stats['quote'], 16).toFixed();
                const totalSupply = new BigNumber(stats['total_supply'], 16).toFixed();

                const baseAddress = stats['base_token'];

                const [reserve0, reserve1] =
                  baseAddress === token0.address ? [baseReserve, quoteReserve] : [quoteReserve, baseReserve];

                return [
                  PairState.EXISTS,
                  new Pair(
                    CurrencyAmount.fromRawAmount(token0, reserve0),
                    CurrencyAmount.fromRawAmount(token1, reserve1),
                    {
                      poolId,
                      totalSupply,
                    },
                  ),
                ];
              } catch (err) {
                return [PairState.NOT_EXISTS, null];
              }
            },
          ),
        );

        setReserves(result);
      } catch (err) {
        setReserves(Array(poolIds.length).fill([PairState.INVALID, null]));
      }
    };
    fetchReserves();
  }, [poolIds]);

  const queuePair = useQueuePair();

  return useMemo(() => {
    return reserves.map(pair => {
      if (pair[1] && pair[1].poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
        return queuePair;
      } else {
        return pair;
      }
    });
  }, [queuePair, reserves]);
}

export function useAvailablePairs(
  currencies: [Currency | undefined, Currency | undefined][],
): { [poolId: number]: Pair } {
  const poolIds = usePoolIds(currencies);

  const availablePoolIds = useMemo(
    () => poolIds.filter((poolId): poolId is PoolIdData => poolId !== null && poolId.poolId > NON_EXISTENT_POOL_ID),
    [poolIds],
  );

  const reserves = useReserves(availablePoolIds);

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
  balance: CurrencyAmount<Token>;
  balance1?: CurrencyAmount<Token>;
}

export function useBalances(
  account: string | null | undefined,
  pools: { [poolId: number]: Pair },
): { [poolId: number]: BalanceData } {
  const [balances, setBalances] = useState<(BalanceData | undefined)[]>([]);

  const [last, setLast] = useState<number>(0);
  const intervalId = useRef<number>(-1);

  useEffect(() => {
    intervalId.current = setInterval(() => setLast(last => last + 1), 20000);

    return () => {
      clearInterval(intervalId.current);
    };
  }, []);

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
