import { useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { CallData, MULTICALL_POOL } from 'packages/BalancedJs/contracts/Multicall';

import bnJs from 'bnJs';
import { canBeQueue } from 'constants/currency';
import { Currency, CurrencyAmount, Token } from 'types/balanced-sdk-core';
import { Pair } from 'types/balanced-v1-sdk';
import { getPair } from 'utils';

import useLastCount from './useLastCount';

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

  useEffect(() => {
    const fetchReserves = async () => {
      try {
        const cds: CallData[] = tokens.map(([tokenA, tokenB]) => {
          if (tokenA && tokenB && tokenA.chainId === tokenB.chainId && !tokenA.equals(tokenB)) {
            if (canBeQueue(tokenA, tokenB)) {
              return {
                target: bnJs.Dex.address,
                method: 'getPoolStats',
                params: [`0x${BalancedJs.utils.POOL_IDS.sICXICX.toString(16)}`],
              };
            } else {
              return {
                target: MULTICALL_POOL,
                method: 'getPoolStatsForPair',
                params: [tokenA.address, tokenB.address],
              };
            }
          } else {
            return {
              target: bnJs.Multicall.address,
              method: 'getBlockNumber',
              params: [],
            };
          }
        });

        const data: any[] = await bnJs.Multicall.getAggregateData(cds);

        const ps = data.map((stats, idx): [PairState, Pair | null] => {
          const [tokenA, tokenB] = tokens[idx];

          if (!tokenA || !tokenB || !stats) {
            return [PairState.NOT_EXISTS, null];
          }

          return getPair(stats, tokenA, tokenB);
        });

        setPairs(ps);
      } catch (err) {
        setPairs(Array(tokens.length).fill([PairState.INVALID, null]));
      }
    };

    if (tokens.length > 0) {
      fetchReserves();
    }
  }, [tokens, last]);

  return pairs;
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

      const poolKeys = Object.keys(pools);

      const cds: CallData[] = poolKeys
        .map(poolId => {
          if (+poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
            return {
              target: bnJs.Dex.address,
              method: 'getICXBalance',
              params: [account],
            };
          } else {
            return {
              target: bnJs.Dex.address,
              method: 'balanceOf',
              params: [account, `0x${(+poolId).toString(16)}`],
            };
          }
        })
        .concat({
          target: bnJs.Dex.address,
          method: 'getSicxEarnings',
          params: [account],
        });

      const data: any[] = await bnJs.Multicall.getAggregateData(cds);
      const sicxBalance = data[data.length - 1];

      const balances = poolKeys.map((poolId, idx) => {
        const pool = pools[+poolId];
        const balance = data[idx];

        if (!pool) return undefined;

        if (+poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
          return {
            poolId: +poolId,
            balance: CurrencyAmount.fromRawAmount(pool.token0, new BigNumber(balance, 16).toFixed()),
            balance1: CurrencyAmount.fromRawAmount(pool.token1, new BigNumber(sicxBalance, 16).toFixed()),
          };
        } else {
          return {
            poolId: +poolId,
            balance: CurrencyAmount.fromRawAmount(pool.liquidityToken, new BigNumber(balance, 16).toFixed()),
          };
        }
      });

      if (balances.length > 0) {
        setBalances(balances);
      }
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
