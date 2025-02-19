import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';

import { BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Token, XChainId } from '@balancednetwork/sdk-core';
import { Pair, PairType } from '@balancednetwork/v1-sdk';
import BigNumber from 'bignumber.js';

import { usePoolPanelContext } from '@/app/pages/trade/supply/_components/PoolPanelContext';
import { BIGINT_ZERO, FRACTION_ZERO } from '@/constants/misc';
import { bnUSD } from '@/constants/tokens';
import { fetchStabilityFundBalances, getAcceptedTokens } from '@/store/stabilityFund/hooks';
import { getPair, getStakingPair } from '@/utils';
import { bnJs } from '@balancednetwork/xwagmi';

import { NETWORK_ID } from '@/constants/config';
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

const fetchStabilityFundPairs = async () => {
  const acceptedTokens = await getAcceptedTokens();
  const stabilityFundBalances = await fetchStabilityFundBalances(
    acceptedTokens.filter(
      x => x === 'cx22319ac7f412f53eabe3c9827acf5e27e9c6a95f' || x === 'cx16f3cb9f09f5cdd902cf07aa752c8b3bd1bc9609',
    ), // only USDC and USDT
  );
  const stabilityFundPairs = Object.values(stabilityFundBalances).map(balance => {
    return new Pair(balance, CurrencyAmount.fromRawAmount(bnUSD[NETWORK_ID], '1'), { type: PairType.STABILITY_FUND });
  });
  return stabilityFundPairs;
};

export const useStabilityFundPairs = () => {
  const { data: stabilityFundPairs } = useQuery({
    queryKey: ['stabilityFundPairs'],
    queryFn: fetchStabilityFundPairs,
    refetchInterval: 10_000,
  });

  return stabilityFundPairs || [];
};

const fetchStakingPair = async () => {
  const res = await bnJs.Dex.getPoolStats(1);
  return getStakingPair(res);
};

export const useStakingPair = () => {
  const { data: stakingPair } = useQuery({
    queryKey: ['stakingPair'],
    queryFn: fetchStakingPair,
    refetchInterval: 10_000,
  });

  return stakingPair;
};

const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  return array.reduce((resultArray: T[][], item, index) => {
    const chunkIndex = Math.floor(index / chunkSize);
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);
};

export async function fetchV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): Promise<PairData[]> {
  const tokens = currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]);

  try {
    const callData: CallData[] = tokens.map(([tokenA, tokenB]) => {
      if (tokenA && tokenB && tokenA.chainId === tokenB.chainId && !tokenA.equals(tokenB)) {
        return {
          target: bnJs.Dex.address,
          method: 'getPoolStatsForPair',
          params: [tokenA.address, tokenB.address],
        };
      } else {
        // Useless, just a placeholder
        return {
          target: bnJs.Multicall.address,
          method: 'getBlockNumber',
          params: [],
        };
      }
    });

    const chunks = chunkArray(callData, MULTI_CALL_BATCH_SIZE);
    const chunkedData = await Promise.all(chunks.map(async chunk => await bnJs.Multicall.getAggregateData(chunk)));
    const data: any[] = chunkedData.flat();

    const pairs = data.map((stats, idx): PairData => {
      const [tokenA, tokenB] = tokens[idx];
      if (!tokenA || !tokenB || !stats) {
        return [PairState.NOT_EXISTS, null, null];
      }
      return getPair(stats, tokenA, tokenB);
    });

    return pairs;
  } catch (err) {
    return Array(tokens.length).fill([PairState.INVALID, null]);
  }
}

export function useV2Pairs(currencies: [Currency | undefined, Currency | undefined][]): PairData[] {
  const tokens = useMemo(() => {
    return currencies.map(([currencyA, currencyB]) => [currencyA?.wrapped, currencyB?.wrapped]);
  }, [currencies]);

  const { data: pairs } = useQuery({
    queryKey: ['v2Pairs', tokens],
    queryFn: () => fetchV2Pairs(currencies),
    enabled: tokens.length > 0,
    refetchInterval: 10_000,
  });

  return pairs || Array(tokens.length).fill([PairState.LOADING, null]);
}

export function useV2Pair(tokenA?: Currency, tokenB?: Currency): PairData {
  const inputs: [[Currency | undefined, Currency | undefined]] = useMemo(() => [[tokenA, tokenB]], [tokenA, tokenB]);
  return useV2Pairs(inputs)[0];
}

export function usePoolShare(poolId: number, tokenA?: Currency, tokenB?: Currency): Fraction {
  const balance: BalanceData | undefined = useBalance(poolId);
  const pair = useV2Pair(tokenA, tokenB)[1];

  return useMemo(() => {
    if (balance && pair && (pair.totalSupply?.quotient || BIGINT_ZERO) > BIGINT_ZERO) {
      const res = balance.stakedLPBalance
        ? balance.balance.add(balance.stakedLPBalance).divide(pair.totalSupply || BIGINT_ZERO)
        : balance.balance.divide(pair.totalSupply || BIGINT_ZERO);
      return new Fraction(res.numerator, res.denominator);
    }

    return FRACTION_ZERO;
  }, [balance, pair]);
}

export function useAvailablePairs(currencies: [Currency | undefined, Currency | undefined][]): {
  [poolId: number]: Pair;
} {
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    async function fetchBalances() {
      if (!account) return;

      const poolKeys = Object.keys(pools);

      const cds = poolKeys.map(poolId => {
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
      });

      const cdsFlatted: CallData[] = cds.flat();
      const data: any[] = await bnJs.Multicall.getAggregateData(cdsFlatted);

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

        return {
          poolId: +poolId,
          balance: CurrencyAmount.fromRawAmount(pool.liquidityToken, new BigNumber(balance || 0, 16).toFixed()),
          suppliedLP: CurrencyAmount.fromRawAmount(pool.liquidityToken, new BigNumber(totalSupply || 0, 16).toFixed()),
          stakedLPBalance: CurrencyAmount.fromRawAmount(
            pool.liquidityToken,
            new BigNumber(stakedLPBalance || 0, 16).toFixed(),
          ),
        };
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
      const suppliedBaseTokens: CurrencyAmount<Currency> = pair.reserve0.multiply(share || 0);
      const suppliedQuoteTokens: CurrencyAmount<Currency> = pair.reserve1.multiply(share || 0);

      return {
        base: suppliedBaseTokens,
        quote: suppliedQuoteTokens,
      };
    } else return;
  }, [pair, balance, share]);
}

export function useBalance(poolId: number) {
  const { balances } = usePoolPanelContext();
  return balances[poolId];
}

//////////////////////////////////////////////////////////////////////////////////////////
export interface Pool {
  poolId: number;
  xChainId: XChainId;
  account: string; // TODO: name to owner?
  balance: CurrencyAmount<Token>;
  stakedLPBalance?: CurrencyAmount<Token>;
  suppliedLP?: CurrencyAmount<Token>;
  pair: Pair;
}

export function usePools(pairs: { [poolId: number]: Pair }, accounts: string[]): Pool[] | undefined {
  const { data: balances } = useQuery<Pool[]>({
    queryKey: ['pools', pairs, accounts],
    queryFn: async (): Promise<Pool[]> => {
      if (!accounts.length) return [];

      const poolKeys = Object.keys(pairs);

      const cds = poolKeys.flatMap(poolId => {
        return accounts.flatMap(account => [
          {
            target: bnJs.Dex.address,
            method: 'xBalanceOf',
            params: [account, `0x${(+poolId).toString(16)}`],
          },
          {
            target: bnJs.Dex.address,
            method: 'totalSupply',
            params: [`0x${(+poolId).toString(16)}`],
          },
          {
            target: bnJs.StakedLP.address,
            method: 'xBalanceOf',
            params: [account, `0x${(+poolId).toString(16)}`],
          },
        ]);
      });

      const chunks = chunkArray(cds, MULTI_CALL_BATCH_SIZE);
      const chunkedData = await Promise.all(chunks.map(async chunk => await bnJs.Multicall.getAggregateData(chunk)));
      const data: any[] = chunkedData.flat();

      const pools = poolKeys.map((poolId, poolIndex) => {
        const pair = pairs[+poolId];

        const accountPools = accounts.map((account, accountIndex) => {
          const _startIndex = poolIndex * accounts.length * 3 + accountIndex * 3;
          const balance = data[_startIndex];
          const totalSupply = data[_startIndex + 1];
          const stakedLPBalance = data[_startIndex + 2];

          const xChainId = account.split('/')[0] as XChainId;
          return {
            poolId: +poolId,
            xChainId,
            account,
            balance: CurrencyAmount.fromRawAmount(pair.liquidityToken, new BigNumber(balance || 0, 16).toFixed()),
            suppliedLP: CurrencyAmount.fromRawAmount(
              pair.liquidityToken,
              new BigNumber(totalSupply || 0, 16).toFixed(),
            ),
            stakedLPBalance: CurrencyAmount.fromRawAmount(
              pair.liquidityToken,
              new BigNumber(stakedLPBalance || 0, 16).toFixed(),
            ),
            pair,
          };
        });

        return accountPools;
      });

      return pools.flat();
    },
    refetchInterval: 10_000,
    placeholderData: keepPreviousData,
  });

  return balances;
}

export const usePoolTokenAmounts = (pool?: Pool) => {
  const { balance, stakedLPBalance, pair } = pool || {};

  const rate = useMemo(() => {
    if (pair?.totalSupply && pair.totalSupply.quotient > BIGINT_ZERO) {
      const amount = (stakedLPBalance ? balance!.add(stakedLPBalance) : balance!).divide(pair.totalSupply);
      return new Fraction(amount.numerator, amount.denominator);
    }
    return FRACTION_ZERO;
  }, [balance, pair, stakedLPBalance]);

  const [base, quote] = useMemo(() => {
    if (pair) {
      return [pair.reserve0.multiply(rate), pair.reserve1.multiply(rate)];
    }
    return [CurrencyAmount.fromRawAmount(bnUSD[NETWORK_ID], '0'), CurrencyAmount.fromRawAmount(bnUSD[NETWORK_ID], '0')];
  }, [pair, rate]);

  return [base, quote];
};

export const usePool = (poolId: number | undefined, account: string): Pool | undefined => {
  const { pools } = usePoolPanelContext();
  return pools.find(pool => pool.poolId === poolId && pool.account === account);
};
