import React, { useEffect, useMemo, useState } from 'react';

import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import { parseInt, range } from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';

import bnJs from 'bnJs';
import { BIGINT_ZERO, FRACTION_ZERO } from 'constants/misc';
import { SUPPORTED_TOKENS_LIST, SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useReward } from 'store/reward/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { Currency, CurrencyAmount, Fraction, Price, Token } from 'types/balanced-sdk-core';

interface PoolState {
  total: CurrencyAmount<Currency>;
  base: CurrencyAmount<Currency>;
  quote: CurrencyAmount<Currency>;
  price: Price<Currency, Currency>;
  inversePrice: Price<Currency, Currency>;
  baseToken: Token;
  quoteToken: Token;
  liquidityToken: Token;
}

function tokenForPair(base: Token, quote: Token): Token | undefined {
  if (base.chainId !== quote.chainId) return;

  return new Token(base.chainId, 'cx0000000000000000000000000000000000000002', 18, 'BALN-V2', 'Balanced V2');
}

export function usePools(): { [poolId: number]: PoolState } {
  const [pools, setPools] = useState<(PoolState | undefined)[]>([]);

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

          console.log(poolId, stats);
          const baseToken = (SUPPORTED_TOKENS_MAP_BY_ADDRESS[stats['base_token']] || SUPPORTED_TOKENS_LIST[0]).wrapped;
          const quoteToken =
            SUPPORTED_TOKENS_MAP_BY_ADDRESS[stats['quote_token'] || 'cx0000000000000000000000000000000000000000']
              .wrapped;

          const liquidityToken = tokenForPair(baseToken, quoteToken);

          if (!liquidityToken) return;

          if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
            const rate = new BigNumber(await bnJs.Staking.getTodayRate(), 16);
            const baseReserve = totalSupply;
            const quoteReserve = totalSupply.times(rate);

            const price = new Price(baseToken, quoteToken, baseReserve.toFixed(), quoteReserve.toFixed());

            const inversePrice = price.invert();

            return {
              total: CurrencyAmount.fromRawAmount(tokenForPair(baseToken, quoteToken)!, totalSupply.toFixed()),
              base: CurrencyAmount.fromRawAmount(baseToken, baseReserve.toFixed()),
              quote: CurrencyAmount.fromRawAmount(quoteToken, quoteReserve.toFixed()),
              price,
              inversePrice,
              baseToken,
              quoteToken,
              liquidityToken,
            };
          } else {
            const baseReserve = new BigNumber(stats['base'], 16);
            const quoteReserve = new BigNumber(stats['quote'], 16);

            const price = new Price(baseToken, quoteToken, baseReserve.toFixed(), quoteReserve.toFixed());

            const inversePrice = price.invert();

            return {
              total: CurrencyAmount.fromRawAmount(tokenForPair(baseToken, quoteToken)!, totalSupply.toFixed()),
              base: CurrencyAmount.fromRawAmount(baseToken, baseReserve.toFixed()),
              quote: CurrencyAmount.fromRawAmount(quoteToken, quoteReserve.toFixed()),
              price,
              inversePrice,
              baseToken,
              quoteToken,
              liquidityToken,
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
  balance: CurrencyAmount<Currency>;
  balance1?: CurrencyAmount<Currency>;
}

export function useBalances(): { [poolId: number]: BalanceState } {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const pools = usePools();

  const [balances, setBalances] = useState<BalanceState[]>([]);

  useEffect(() => {
    async function fetchBalances() {
      if (!account) return;

      const balances = await Promise.all(
        Object.keys(pools).map(async poolId => {
          if (+poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
            const [balance, balance1] = await Promise.all([
              bnJs.Dex.getICXBalance(account),
              bnJs.Dex.getSicxEarnings(account),
            ]);

            return {
              balance: CurrencyAmount.fromRawAmount(pools[poolId].quoteToken, new BigNumber(balance, 16).toFixed()),
              balance1: CurrencyAmount.fromRawAmount(pools[poolId].baseToken, new BigNumber(balance1, 16).toFixed()),
            };
          } else {
            const balance = await bnJs.Dex.balanceOf(account, +poolId);

            return {
              balance: CurrencyAmount.fromRawAmount(pools[poolId].liquidityToken, new BigNumber(balance, 16).toFixed()),
            };
          }
        }),
      );

      setBalances(balances);
    }

    fetchBalances();
  }, [account, pools, transactions]);

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
      .filter(poolId => JSBI.greaterThan(balances[+poolId].balance.quotient, BIGINT_ZERO))
      .filter(poolId => +poolId !== BalancedJs.utils.POOL_IDS.sICXICX)
      .forEach(poolId => {
        t[poolId] = balances[+poolId];
      });

    return t;
  }, [balances]);
}

export function usePool(poolId: number): PoolState | undefined {
  const pools = usePools();
  return pools[poolId];
}

export function usePoolShare(poolId: number): Fraction {
  const balances = useBalances();
  const balance: BalanceState | undefined = balances[poolId];
  const pool = usePool(poolId);

  return React.useMemo(() => {
    if (balance && pool && JSBI.greaterThan(pool.total.quotient, BIGINT_ZERO))
      return balance.balance.divide(pool.total);
    else return FRACTION_ZERO;
  }, [balance, pool]);
}

export function useBalance(poolId: number) {
  const balances = useBalances();
  const balance: BalanceState | undefined = balances[poolId];
  const pool = usePool(poolId);
  const poolShare = usePoolShare(poolId);

  return React.useMemo(() => {
    if (pool && balance) {
      let suppliedBaseTokens: CurrencyAmount<Currency>;
      let suppliedQuoteTokens: CurrencyAmount<Currency>;

      if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
        suppliedBaseTokens = balance.balance;
        suppliedQuoteTokens = balance.balance;
      } else {
        suppliedBaseTokens = pool.base.multiply(poolShare);
        suppliedQuoteTokens = pool.quote.multiply(poolShare);
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
      const [rewardNumerator, rewardDenominator] = reward.toFraction();
      const rewardFraction = new Fraction(rewardNumerator.toFixed(), rewardDenominator.toFixed());
      return {
        totalBase: pool.base,
        totalQuote: pool.quote,
        totalReward: rewardFraction,
        suppliedBase: balance?.base,
        suppliedQuote: balance?.quote,
        suppliedReward: poolShare.multiply(rewardFraction),
        poolShare,
      };
    }
  }, [pool, balance, reward, poolShare]);
}
