import React, { useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import { parseInt, range } from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';

import bnJs from 'bnJs';
import { ONE, ZERO } from 'constants/index';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useRatio } from 'store/ratio/hooks';
import { useReward } from 'store/reward/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { Pool } from 'types';
import { Currency } from 'types/balanced-sdk-core';

import { Balance } from './reducer';

interface PoolState {
  total: BigNumber;
  base: BigNumber;
  quote: BigNumber;
  baseDeposited: BigNumber;
  quoteDeposited: BigNumber;
  rate: BigNumber;
  inverseRate: BigNumber;
  baseCurrency: Currency;
  quoteCurrency: Currency;
}

export function usePools() {
  const [pools, setPools] = useState<PoolState[]>([]);

  const transactions = useAllTransactions();

  useEffect(() => {
    async function fetchPools() {
      const nonce = await bnJs.Dex.getNonce();

      const limit = parseInt(nonce, 16);

      const poolIds = range(1, limit);

      const pools = await Promise.all(
        poolIds.map(async poolId => {
          const stats = await bnJs.Dex.getPoolStats(poolId);

          const totalSupply = new BigNumber(stats['total_supply'], 16);

          if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
            const rate = new BigNumber(await bnJs.Staking.getTodayRate(), 16);
            const baseReserve = totalSupply;
            const quoteReserve = totalSupply.times(rate);

            const inverseRate = ONE.div(rate);

            return {
              total: totalSupply,
              base: baseReserve,
              quote: quoteReserve,
              baseDeposited: ZERO,
              quoteDeposited: ZERO,
              rate: rate,
              inverseRate: inverseRate,
              baseCurrency: SUPPORTED_TOKENS_MAP_BY_ADDRESS[stats['base_token']],
              quoteCurrency: SUPPORTED_TOKENS_MAP_BY_ADDRESS[stats['quote_token']],
            };
          } else {
            const baseReserve = new BigNumber(stats['base'], 16);
            const quoteReserve = new BigNumber(stats['quote'], 16);

            const rate = quoteReserve.div(baseReserve);
            const inverseRate = baseReserve.div(quoteReserve);

            return {
              total: totalSupply,
              base: baseReserve,
              quote: quoteReserve,
              baseDeposited: ZERO,
              quoteDeposited: ZERO,
              rate: rate,
              inverseRate: inverseRate,
              baseCurrency: SUPPORTED_TOKENS_MAP_BY_ADDRESS[stats['base_token']],
              quoteCurrency: SUPPORTED_TOKENS_MAP_BY_ADDRESS[stats['quote_token']],
            };
          }
        }),
      );

      setPools(pools);
    }

    fetchPools();
  }, [transactions]);

  return useMemo(() => {
    return pools.reduce((acc, curr, idx) => {
      acc[idx + 1] = curr;
      return acc;
    }, {});
  }, [pools]);
}

interface BalanceState {
  balance: BigNumber;
  balance1?: BigNumber;
}

export function useBalances() {
  const { account } = useIconReact();
  const transactions = useAllTransactions();

  const [balances, setBalances] = useState<BalanceState[]>([]);

  useEffect(() => {
    async function fetchBalances() {
      if (!account) return;

      const nonce = await bnJs.Dex.getNonce();

      const limit = parseInt(nonce, 16);

      const poolIds = range(1, limit);

      const balances = await Promise.all(
        poolIds.map(async poolId => {
          if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
            const [balance, balance1] = await Promise.all([
              bnJs.Dex.getICXBalance(account),
              bnJs.Dex.getSicxEarnings(account),
            ]);

            return {
              balance: new BigNumber(balance, 16),
              balance1: new BigNumber(balance1, 16),
            };
          } else {
            const balance = await bnJs.Dex.balanceOf(account, poolId);

            return {
              balance: new BigNumber(balance, 16),
            };
          }
        }),
      );

      setBalances(balances);
    }

    fetchBalances();
  }, [account, transactions]);

  return useMemo(() => {
    return balances.reduce((acc, curr, idx) => {
      acc[idx + 1] = curr;
      return acc;
    }, {});
  }, [balances]);
}

export function useAvailableBalances() {
  const balances = useBalances();

  return React.useMemo(() => {
    let t = {};

    Object.keys(balances)
      .filter(poolId => !balances[poolId].balance.isZero())
      .filter(poolId => parseInt(poolId) !== BalancedJs.utils.POOL_IDS.sICXICX)
      .forEach(poolId => {
        t[poolId] = balances[poolId];
      });

    return t;
  }, [balances]);
}

export function usePool(poolId: number): Pool {
  const pools = usePools();
  return pools[poolId];
}

export function usePoolShare(poolId: number) {
  const balances = useBalances();
  const balance: Balance | undefined = balances[poolId];
  const pool = usePool(poolId);

  return React.useMemo(() => {
    if (balance && pool && !pool.total.isZero()) return balance.balance.div(pool.total);
    else return new BigNumber(0);
  }, [balance, pool]);
}

export function useBalance(poolId: number) {
  const balances = useBalances();
  const balance: BalanceState | undefined = balances[poolId];
  const pool = usePool(poolId);
  const poolShare = usePoolShare(poolId);

  return React.useMemo(() => {
    if (pool && balance) {
      let suppliedBaseTokens: BigNumber;
      let suppliedQuoteTokens: BigNumber;

      if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
        suppliedBaseTokens = balance.balance;
        suppliedQuoteTokens = balance.balance;
      } else {
        suppliedBaseTokens = pool.base.times(poolShare);
        suppliedQuoteTokens = pool.quote.times(poolShare);
      }

      return {
        ...balance,
        base: suppliedBaseTokens,
        quote: suppliedQuoteTokens,
      };
    } else return;
  }, [balance, pool, poolShare, poolId]);
}

export function usePoolData(poolId: number) {
  const pool = usePool(poolId);
  const balance = useBalance(poolId);
  const reward = useReward(poolId);
  const poolShare = usePoolShare(poolId);

  return React.useMemo(() => {
    if (pool && reward) {
      return {
        totalBase: pool.base,
        totalQuote: pool.quote,
        totalReward: reward,
        suppliedBase: balance?.base,
        suppliedQuote: balance?.quote,
        suppliedReward: reward.times(poolShare),
        poolShare,
      };
    }
  }, [pool, balance, reward, poolShare]);
}

export function useRates() {
  const [rates, setRates] = React.useState({});

  React.useEffect(() => {
    const fetchRates = async () => {
      const [sicx, res] = await Promise.all([
        bnJs.Dex.getPrice(BalancedJs.utils.POOL_IDS.sICXbnUSD),
        bnJs.Band.getReferenceData({ _base: 'ICX', _quote: 'USD' }),
      ]);

      setRates({
        sICX: BalancedJs.utils.toIcx(sicx),
        ICX: BalancedJs.utils.toIcx(res['rate']),
        bnUSD: new BigNumber(1),
      });
    };

    fetchRates();
  }, []);

  return rates;
}

export function useAPYs() {
  const [apys, setAPYs] = React.useState<{ [key: string]: BigNumber }>({});

  // calculate sICX/ICX APY
  const totalDailyReward = useReward(BalancedJs.utils.POOL_IDS.sICXICX);
  const totalICXLiquidity = usePool(BalancedJs.utils.POOL_IDS.sICXICX);
  const ratio = useRatio();
  const rewards = React.useMemo(
    () =>
      totalDailyReward
        ?.times(365)
        .times(ratio.BALNbnUSDratio)
        .div(totalICXLiquidity?.total || ZERO)
        .div(ratio.ICXUSDratio),
    [totalDailyReward, ratio.BALNbnUSDratio, totalICXLiquidity, ratio.ICXUSDratio],
  );

  React.useEffect(() => {
    if (rewards && !rewards.isNaN() && !rewards.isZero() && rewards.isFinite()) {
      setAPYs(state => ({ ...state, [BalancedJs.utils.POOL_IDS.sICXICX]: rewards }));
    }
  }, [rewards, setAPYs]);

  // calculate BALN/sICX APY
  const totalDailyReward1 = useReward(BalancedJs.utils.POOL_IDS.BALNsICX);
  const totalLiquidity1 = usePool(BalancedJs.utils.POOL_IDS.BALNsICX);
  const rewards1 = React.useMemo(
    () =>
      totalDailyReward1
        ?.times(365)
        .div(totalLiquidity1?.base || ZERO)
        .div(2),
    [totalDailyReward1, totalLiquidity1],
  );

  React.useEffect(() => {
    if (rewards1 && !rewards1.isNaN() && !rewards1.isZero() && rewards1.isFinite()) {
      setAPYs(state => ({ ...state, [BalancedJs.utils.POOL_IDS.BALNsICX]: rewards1 }));
    }
  }, [rewards1, setAPYs]);

  //
  React.useEffect(() => {
    const fetchAPYs = async () => {
      const t = {
        'sICX/bnUSD': 2,
        'BALN/bnUSD': 3,
      };

      Object.entries(t).forEach(async ([poolName, poolId]) => {
        try {
          const res = await bnJs.Rewards.getAPY(poolName);
          setAPYs(state => ({ ...state, [poolId]: BalancedJs.utils.toIcx(res) }));
        } catch (e) {
          console.error(e);
        }
      });

      const [res3, res4, res5] = await Promise.all([
        bnJs.Rewards.getAPY('Loans'),
        bnJs.Dex.getQuotePriceInBase(BalancedJs.utils.POOL_IDS.sICXbnUSD),
        bnJs.Band.getReferenceData({ _base: 'USD', _quote: 'ICX' }),
      ]);

      setAPYs(state => ({
        ...state,
        Loans: BalancedJs.utils
          .toIcx(res3)
          .multipliedBy(BalancedJs.utils.toIcx(res4).dividedBy(BalancedJs.utils.toIcx(res5['rate']))),
      }));
    };

    fetchAPYs();
  }, []);

  return apys;
}
