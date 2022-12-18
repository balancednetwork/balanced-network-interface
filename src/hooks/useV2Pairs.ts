import { useEffect, useMemo, useState } from 'react';

import { BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Token } from '@balancednetwork/sdk-core';
import { Pair } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';

import { usePoolPanelContext } from 'app/components/trade/PoolPanelContext';
import bnJs from 'bnJs';
import { canBeQueue } from 'constants/currency';
import { BIGINT_ZERO, FRACTION_ZERO } from 'constants/misc';
import { getPair } from 'utils';

import useLastCount from './useLastCount';

const NON_EXISTENT_POOL_ID = 0;
const MULTI_CALL_BATCH_SIZE = 25;

export enum PairState {
  LOADING,
  NOT_EXISTS,
  EXISTS,
  INVALID,
}

export type PairData = [PairState, Pair | null, BigNumber | null] | [PairState, Pair | null];

export function useV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): PairData[] {
  const tokens = useMemo(() => {
    return currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]);
  }, [currencies]);

  const [pairs, setPairs] = useState<PairData[]>(Array(tokens.length).fill([PairState.LOADING, null]));

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
                target: bnJs.Dex.address,
                method: 'getPoolStatsForPair',
                params: [tokenA.address, tokenB.address],
              };
            }
          } else {
            // useless, just a placeholder
            return {
              target: bnJs.Multicall.address,
              method: 'getBlockNumber',
              params: [],
            };
          }
        });

        const chunks = cds.reduce((resultArray, item, index) => {
          const chunkIndex = Math.floor(index / MULTI_CALL_BATCH_SIZE);
          if (!resultArray[chunkIndex]) {
            //@ts-ignore
            resultArray[chunkIndex] = [];
          }
          //@ts-ignore
          resultArray[chunkIndex].push(item);
          return resultArray;
        }, []);

        const chunkedData = await Promise.all(chunks.map(async chunk => await bnJs.Multicall.getAggregateData(chunk)));
        const data: any[] = chunkedData.flat();

        const ps = data.map(
          (stats, idx): PairData => {
            const [tokenA, tokenB] = tokens[idx];

            if (!tokenA || !tokenB || !stats) {
              return [PairState.NOT_EXISTS, null, null];
            }

            return getPair(stats, tokenA, tokenB);
          },
        );

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

export function useV2Pair(tokenA?: Currency, tokenB?: Currency): PairData {
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB]);
  return useV2Pairs(inputs)[0];
}

export function usePoolShare(poolId: number, tokenA?: Currency, tokenB?: Currency): Fraction {
  const balance: BalanceData | undefined = useBalance(poolId);
  const pair = useV2Pair(tokenA, tokenB)[1];

  return useMemo(() => {
    if (balance && pair && JSBI.greaterThan(pair.totalSupply?.quotient || BIGINT_ZERO, BIGINT_ZERO)) {
      const res = balance.stakedLPBalance
        ? balance.balance.add(balance.stakedLPBalance).divide(pair.totalSupply || BIGINT_ZERO)
        : balance.balance.divide(pair.totalSupply || BIGINT_ZERO);
      return new Fraction(res.numerator, res.denominator);
    }

    return FRACTION_ZERO;
  }, [balance, pair]);
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

  suppliedLP?: CurrencyAmount<Token>;

  stakedLPBalance?: CurrencyAmount<Token>;
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

      let cds = poolKeys
        .map(poolId => {
          if (+poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
            return {
              target: bnJs.Dex.address,
              method: 'getICXBalance',
              params: [account],
            };
          } else {
            return [
              {
                target: bnJs.Dex.address,
                method: 'balanceOf',
                params: [account, `0x${(+poolId).toString(16)}`],
              },
              {
                target: bnJs.Dex.address,
                method: 'totalSupply',
                params: [`0x${(+poolId).toString(16)}`],
              },
              {
                target: bnJs.StakedLP.address,
                method: 'balanceOf',
                params: [account, `0x${(+poolId).toString(16)}`],
              },
            ];
          }
        })
        .concat({
          target: bnJs.Dex.address,
          method: 'getSicxEarnings',
          params: [account],
        });

      const cdsFlatted: CallData[] = cds.flat();
      const data: any[] = await bnJs.Multicall.getAggregateData(cdsFlatted);
      const sicxBalance = data[data.length - 1];
      const icxBalance = !Array.isArray(data[0]) ? data[0] : 0;

      // Remapping the result was returned by multicall based on the order of the cds
      let trackedIdx = 0;
      const reMappingData = cds.map((cdsItem, idx) => {
        if (Array.isArray(cdsItem)) {
          const tmp = data.slice(trackedIdx, trackedIdx + cdsItem.length);
          trackedIdx += cdsItem.length;
          return tmp;
        }
        trackedIdx += 1;
        return data[idx];
      });

      const balances = poolKeys.map((poolId, idx) => {
        const pool = pools[+poolId];
        let balance = reMappingData[idx][0];
        let totalSupply;
        let stakedLPBalance;

        if (Array.isArray(cds[idx])) {
          balance = reMappingData[idx][0];
          totalSupply = reMappingData[idx][1];
          stakedLPBalance = reMappingData[idx][2];
        }

        if (!pool) return undefined;

        if (+poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
          return {
            poolId: +poolId,
            balance: CurrencyAmount.fromRawAmount(pool.token0, new BigNumber(icxBalance, 16).toFixed()),
            balance1: CurrencyAmount.fromRawAmount(pool.token1, new BigNumber(sicxBalance || 0, 16).toFixed()),
          };
        } else {
          return {
            poolId: +poolId,
            balance: CurrencyAmount.fromRawAmount(pool.liquidityToken, new BigNumber(balance || 0, 16).toFixed()),
            suppliedLP: CurrencyAmount.fromRawAmount(
              pool.liquidityToken,
              new BigNumber(totalSupply || 0, 16).toFixed(),
            ),
            stakedLPBalance: CurrencyAmount.fromRawAmount(
              pool.liquidityToken,
              new BigNumber(stakedLPBalance || 0, 16).toFixed(),
            ),
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

export function useSuppliedTokens(poolId: number, tokenA?: Currency, tokenB?: Currency) {
  const balance: BalanceData | undefined = useBalance(poolId);
  const share = usePoolShare(poolId, tokenA, tokenB);
  const pair = useV2Pair(tokenA, tokenB)[1];

  return useMemo(() => {
    if (pair && balance) {
      let suppliedBaseTokens: CurrencyAmount<Currency>;
      let suppliedQuoteTokens: CurrencyAmount<Currency>;

      if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
        suppliedBaseTokens = balance.balance;
        suppliedQuoteTokens = balance.balance;
      } else {
        suppliedBaseTokens = pair.reserve0.multiply(share || 0);
        suppliedQuoteTokens = pair.reserve1.multiply(share || 0);
      }

      return {
        base: suppliedBaseTokens,
        quote: suppliedQuoteTokens,
      };
    } else return;
  }, [pair, balance, poolId, share]);
}

export function useBalance(poolId: number) {
  const { balances } = usePoolPanelContext();
  return balances[poolId];
}
