import { useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';

import bnJs from 'bnJs';
import { canBeQueue } from 'constants/currency';
import { NULL_CONTRACT_ADDRESS } from 'constants/tokens';
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

                let stats;
                let poolId;

                try {
                  poolId = parseInt(await bnJs.Dex.getPoolId(tokenA.address, tokenB.address), 16);
                  if (poolId === 0) return [PairState.NOT_EXISTS, null];
                  stats = await bnJs.Dex.getPoolStats(poolId);
                } catch (err) {
                  return [PairState.NOT_EXISTS, null];
                }

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

export function usePoolIds(currencies: [Currency | undefined, Currency | undefined][]): (number | null)[] {
  const [ids, setIds] = useState<(number | null)[]>([]);

  const tokens = useMemo(() => {
    return currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]);
  }, [currencies]);

  useEffect(() => {
    setIds(Array(tokens.length).fill(null));

    const fetchIds = async () => {
      try {
        const result = await Promise.all(
          tokens.map(async ([tokenA, tokenB]) => {
            if (tokenA && tokenB && tokenA.chainId === tokenB.chainId && !tokenA.equals(tokenB)) {
              if (canBeQueue(tokenA, tokenB)) return BalancedJs.utils.POOL_IDS.sICXICX;
              try {
                return parseInt(await bnJs.Dex.getPoolId(tokenA.address, tokenB.address), 16);
              } catch (err) {
                return NON_EXISTENT_POOL_ID;
              }
            } else return NON_EXISTENT_POOL_ID;
          }),
        );

        setIds(result);
      } catch (err) {
        setIds(Array(tokens.length).fill(NON_EXISTENT_POOL_ID));
      }
    };
    fetchIds();
  }, [tokens]);

  return ids;
}

interface ReserveState {
  reserve0: string;
  reserve1: string;
  poolId: number;
  totalSupply: string;
  address0: string;
  address1: string;
}

export function useReserves(poolIds: number[]): (PairState | ReserveState | null)[] {
  const [reserves, setReserves] = useState<(ReserveState | number | null)[]>([]);

  // const lastBlockNumber = useBlockNumber();

  useEffect(() => {
    setReserves(Array(poolIds.length).fill(PairState.LOADING));

    const fetchReserves = async () => {
      try {
        const result = await Promise.all(
          poolIds.map(async poolId => {
            let stats;

            try {
              stats = await bnJs.Dex.getPoolStats(poolId);
            } catch (err) {
              return null;
            }

            const baseReserve = new BigNumber(stats['base'], 16).toFixed();
            const quoteReserve = new BigNumber(stats['quote'], 16).toFixed();
            const totalSupply = new BigNumber(stats['total_supply'], 16).toFixed();

            const baseAddress = stats['base_token'] || NULL_CONTRACT_ADDRESS;
            const quoteAddress = stats['quote_token'] || NULL_CONTRACT_ADDRESS;

            return {
              address0: baseAddress,
              address1: quoteAddress,
              reserve0: baseReserve,
              reserve1: quoteReserve,
              totalSupply,
              poolId,
            };
          }),
        );

        setReserves(result);
      } catch (err) {
        setReserves(Array(poolIds.length).fill(PairState.INVALID));
      }
    };
    fetchReserves();
  }, [poolIds]);

  return reserves;
}

export function useAvailablePairs(
  currencies: [Currency | undefined, Currency | undefined][],
): { [poolId: number]: Pair } {
  const poolIds = usePoolIds(currencies);

  const tokenPairs = useMemo(() => {
    return currencies.reduce((acc, cur, i) => {
      const [currencyA, currencyB] = cur;
      const poolId = poolIds[i];
      if (poolId !== null && poolId > 0) acc[poolId] = [currencyA?.wrapped, currencyB?.wrapped];
      return acc;
    }, {});
  }, [poolIds, currencies]);

  const availablePoolIds = useMemo(() => poolIds.filter((poolId): poolId is number => poolId !== null && poolId > 0), [
    poolIds,
  ]);

  const reserves = useReserves(availablePoolIds);

  const queuePair = useQueuePair();

  const pairs = useMemo<[PairState, Pair | null][]>(() => {
    return reserves.map((result, i) => {
      if (result === null) return [PairState.NOT_EXISTS, null];

      if (typeof result === 'number') {
        if (result === PairState.LOADING) return [PairState.LOADING, null];
        return [PairState.INVALID, null];
      }

      const poolId = result.poolId;

      const tokenA = tokenPairs[poolId][0];
      const tokenB = tokenPairs[poolId][1];

      if (!tokenA || !tokenB || tokenA.equals(tokenB)) return [PairState.INVALID, null];

      if (canBeQueue(tokenA, tokenB)) return queuePair;

      if (!result) return [PairState.NOT_EXISTS, null];

      const { reserve0, reserve1, totalSupply, address0 } = result;

      const [token0, token1] = tokenA.address === address0 ? [tokenA, tokenB] : [tokenB, tokenA];

      return [
        PairState.EXISTS,
        new Pair(CurrencyAmount.fromRawAmount(token0, reserve0), CurrencyAmount.fromRawAmount(token1, reserve1), {
          poolId,
          totalSupply,
        }),
      ];
    });
  }, [queuePair, reserves, tokenPairs]);

  return useMemo<{ [poolId: number]: Pair }>(() => {
    return pairs.reduce((acc, ps) => {
      const pairState = ps[0];
      const pair = ps[1];
      const poolId = pair?.poolId;

      if (pairState === PairState.EXISTS && pair && poolId && poolId > 0) {
        acc[poolId] = pair;
      }

      return acc;
    }, {});
  }, [pairs]);
}

export interface BalanceState {
  poolId: number;
  balance: CurrencyAmount<Token>;
  balance1?: CurrencyAmount<Token>;
}

export function useBalances(
  account: string | null | undefined,
  pools: { [poolId: number]: Pair },
): { [poolId: number]: BalanceState } {
  const [balances, setBalances] = useState<(BalanceState | undefined)[]>([]);

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
  }, [account, pools]);

  return useMemo(() => {
    return balances.reduce((acc, curr) => {
      if (curr && curr.poolId > 0) acc[curr.poolId] = curr;
      return acc;
    }, {});
  }, [balances]);
}
