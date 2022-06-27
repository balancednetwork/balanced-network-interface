import { useEffect, useMemo, useState } from 'react';

import { BalancedJs, CallData } from '@balancednetwork/balanced-js';
import { Currency, CurrencyAmount, Fraction, Price, Token } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import JSBI from 'jsbi';
import { parseInt, range } from 'lodash';
import { useIconReact } from 'packages/icon-react';

import bnJs from 'bnJs';
import { BIGINT_ZERO, FRACTION_ZERO } from 'constants/misc';
import { NULL_CONTRACT_ADDRESS, SUPPORTED_TOKENS_LIST } from 'constants/tokens';
import { useReward } from 'store/reward/hooks';
import { useAllTransactions } from 'store/transactions/hooks';
import { useUserAddedTokens } from 'store/user/hooks';
import { toFraction } from 'utils';

interface PoolState {
  total: CurrencyAmount<Currency>;
  base: CurrencyAmount<Currency>;
  quote: CurrencyAmount<Currency>;
  price: Price<Currency, Currency>;
  inversePrice: Price<Currency, Currency>;
  baseToken: Token;
  quoteToken: Token;
  liquidityToken: Token;
  minQuoteTokenAmount: BigNumber;
}

export function pairToken(chainId: number, decimals: number): Token {
  return new Token(chainId, 'cx0000000000000000000000000000000000000002', decimals, 'BALN-V2', 'Balanced V2');
}

function tokenForPair(base: Token, quote: Token): Token | undefined {
  if (base.chainId !== quote.chainId) return;
  const decimal0 = base.decimals;
  const decimal1 = quote.decimals;
  const decimals = decimal0 !== decimal1 ? (decimal0 + decimal1) / 2 : decimal0;
  return pairToken(base.chainId, decimals);
}

export function usePools(): { [poolId: number]: PoolState } {
  const [pools, setPools] = useState<(PoolState | undefined)[]>([]);
  const transactions = useAllTransactions();
  const userAddedTokens = useUserAddedTokens();

  const tokensByAddress = useMemo(() => {
    const tokens = [...SUPPORTED_TOKENS_LIST, ...userAddedTokens];

    return tokens.reduce<{ [key: string]: Token }>((acc, token) => {
      acc[token.address] = token;

      return acc;
    }, {});
  }, [userAddedTokens]);

  useEffect(() => {
    async function fetchPools() {
      const nonce = await bnJs.Dex.getNonce();

      const limit = parseInt(nonce, 16);

      const poolIds = range(1, limit);

      let cds: CallData[] = poolIds
        .map(poolId => {
          return {
            target: bnJs.Dex.address,
            method: 'getPoolStats',
            params: [`0x${(+poolId).toString(16)}`],
          };
        })
        .concat({
          target: bnJs.Staking.address,
          method: 'getTodayRate',
          params: [],
        });
      const data = await bnJs.Multicall.getAggregateData(cds);
      const sicxTodayRate = data[data.length - 1];

      const ps = poolIds.map((poolId, idx) => {
        const stats = data[idx];
        const totalSupply = new BigNumber(data[idx]['total_supply'], 16);

        // which is better? for code readability or best practices
        // NULL_CONTRACT_ADDRESS or bnJs.ICX.address?
        const baseToken = tokensByAddress[stats['base_token'] || NULL_CONTRACT_ADDRESS];
        const quoteToken = tokensByAddress[stats['quote_token'] || NULL_CONTRACT_ADDRESS];
        const minQuoteTokenAmount = new BigNumber(stats['min_quote'], 16).div(
          new BigNumber(10).pow(stats['quote_decimals']),
        );

        if (!baseToken || !quoteToken) return undefined;

        const liquidityToken = tokenForPair(baseToken, quoteToken);

        if (!liquidityToken) return undefined;

        if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
          const rate = sicxTodayRate;
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
            minQuoteTokenAmount,
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
            minQuoteTokenAmount,
          };
        }
      });
      setPools(ps);
    }

    fetchPools();
  }, [tokensByAddress, transactions]);

  return useMemo(() => {
    return pools.reduce((acc, curr, idx) => {
      acc[idx + 1] = curr;
      return acc;
    }, {});
  }, [pools]);
}

interface BalanceState {
  balance: CurrencyAmount<Token>;
  balance1?: CurrencyAmount<Token>;
  suppliedLP?: CurrencyAmount<Token>;
  stakedLPBalance?: CurrencyAmount<Token>;
}

export function useBalances(): { [poolId: number]: BalanceState } {
  const { account } = useIconReact();
  const pools = usePools();
  const transactions = useAllTransactions();
  const [balances, setBalances] = useState<(BalanceState | undefined)[]>([]);

  useEffect(() => {
    async function fetchBalances() {
      if (!account) return;

      const poolKeys = Object.keys(pools);

      let cds = poolKeys.map(poolId => {
        if (+poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
          return [
            {
              target: bnJs.Dex.address,
              method: 'getICXBalance',
              params: [account],
            },
            {
              target: bnJs.Dex.address,
              method: 'getSicxEarnings',
              params: [account],
            },
          ];
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
      });

      const cdsFlatted: CallData[] = cds.flat();
      const data: any[] = await bnJs.Multicall.getAggregateData(cdsFlatted);

      // Remapping the result was returned by multicall based on the order of the cds
      let trackedIdx = 0;
      const reMappingData = cds.map((cdsItem, idx) => {
        if (cdsItem.length === 2) {
          trackedIdx += 2;
          return [data[trackedIdx - 2], data[trackedIdx - 1]];
        } else {
          trackedIdx += 3;
          return [data[trackedIdx - 3], data[trackedIdx - 2], data[trackedIdx - 1]];
        }
      });

      const balances = poolKeys.map((poolId, idx) => {
        const pool = pools[+poolId];
        let balance = reMappingData[idx][0];
        let stakedLPBalance;
        let totalSupply;

        if (Array.isArray(cds[idx])) {
          balance = reMappingData[idx][0];
          totalSupply = reMappingData[idx][1];
          stakedLPBalance = reMappingData[idx][2];
        }

        if (!pool) return undefined;

        if (+poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
          return {
            poolId: +poolId,
            balance: CurrencyAmount.fromRawAmount(pool.quoteToken, new BigNumber(balance || 0, 16).toFixed()),
            balance1: CurrencyAmount.fromRawAmount(
              pool.baseToken,
              new BigNumber(reMappingData[idx][1] || 0, 16).toFixed(),
            ),
          };
        } else {
          return {
            poolId: +poolId,
            balance: CurrencyAmount.fromRawAmount(pool.liquidityToken, new BigNumber(balance || 0, 16).toFixed()),
            suppliedLP: CurrencyAmount.fromRawAmount(pool.liquidityToken, new BigNumber(totalSupply, 16).toFixed()),
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

  return useMemo(() => {
    let t = {};

    Object.keys(balances)
      .filter(
        poolId =>
          balances[+poolId] &&
          !(
            JSBI.equal(balances[+poolId].balance.quotient, BIGINT_ZERO) &&
            JSBI.equal(balances[+poolId].stakedLPBalance?.quotient || BIGINT_ZERO, BIGINT_ZERO)
          ),
      )
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

  return useMemo(() => {
    if (balance && pool && JSBI.greaterThan(pool.total.quotient, BIGINT_ZERO)) {
      const res = balance.stakedLPBalance
        ? balance.balance.add(balance.stakedLPBalance).divide(pool.total)
        : balance.balance.divide(pool.total);
      return new Fraction(res.numerator, res.denominator);
    }

    return FRACTION_ZERO;
  }, [balance, pool]);
}

export function useBalance(poolId: number) {
  const balances = useBalances();
  const balance: BalanceState | undefined = balances[poolId];
  const pool = usePool(poolId);
  const poolShare = usePoolShare(poolId);

  return useMemo(() => {
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

  return useMemo(() => {
    if (pool) {
      // it's a fraction, yet represents BALN amount
      const rewardFrac = toFraction(reward);
      return {
        totalBase: pool.base,
        totalQuote: pool.quote,
        minQuoteTokenAmount: pool.minQuoteTokenAmount,
        totalLP: balance?.balance,
        suppliedLP: balance?.suppliedLP,
        totalReward: rewardFrac,
        suppliedBase: balance?.base,
        suppliedQuote: balance?.quote,
        suppliedReward: poolShare.multiply(rewardFrac),
        poolShare,
        stakedLPBalance: balance?.stakedLPBalance,
      };
    }
  }, [pool, balance, reward, poolShare]);
}
