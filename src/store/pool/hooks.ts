import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import addresses from 'packages/BalancedJs/addresses';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { Pair, SUPPORTED_PAIRS } from 'constants/currency';
import { ONE, ZERO } from 'constants/index';
import { useRatio } from 'store/ratio/hooks';
import { useReward } from 'store/reward/hooks';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppDispatch, AppState } from '../index';
import { setBalance, setPair, setPoolData, clearBalances as clearBalancesCreator } from './actions';
import { Balance, Pool } from './reducer';

export function usePoolPair(): Pair {
  return useSelector((state: AppState) => state.pool.selectedPair);
}

export function useSetPair(): (pair: Pair) => void {
  const dispatch = useDispatch<AppDispatch>();

  return React.useCallback(
    pair => {
      dispatch(setPair(pair));
    },
    [dispatch],
  );
}

export function useChangePool(): (poolId: number, poolData: Partial<Pool>) => void {
  const dispatch = useDispatch<AppDispatch>();

  return React.useCallback(
    (poolId, poolData) => {
      dispatch(setPoolData({ poolId, poolData }));
    },
    [dispatch],
  );
}

export function useBalanceActionHandlers(): {
  changeBalance: (poolId: number, balance: Balance) => void;
  clearBalances: () => void;
} {
  const dispatch = useDispatch<AppDispatch>();

  const changeBalance = React.useCallback(
    (poolId, balance) => {
      dispatch(setBalance({ poolId, balance }));
    },
    [dispatch],
  );

  const clearBalances = React.useCallback(() => {
    dispatch(clearBalancesCreator());
  }, [dispatch]);

  return { changeBalance, clearBalances };
}

// fetch pools
export function useFetchPools() {
  const { account } = useIconReact();
  const transactions = useAllTransactions();
  const changePool = useChangePool();
  const { networkId } = useIconReact();

  // fetch pool stats
  const fetchPool = React.useCallback(
    async (pair: Pair) => {
      const poolId = pair.poolId;

      if (!pair) return;

      const baseAddress = addresses[networkId][pair.baseCurrencyKey.toLowerCase()];
      const quoteAddress = addresses[networkId][pair.quoteCurrencyKey.toLowerCase()];

      let result;

      if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
        const [t, rate] = await Promise.all([bnJs.Dex.totalSupply(poolId), await bnJs.Staking.getTodayRate()]);

        result = [t, t, t, rate, 0, 0];
      } else {
        result = await Promise.all([
          bnJs.Dex.totalSupply(poolId),
          bnJs.Dex.getPoolTotal(poolId, baseAddress),
          bnJs.Dex.getPoolTotal(poolId, quoteAddress),
          bnJs.Dex.getPrice(poolId),
          account && bnJs.Dex.getDeposit(baseAddress, account),
          account && bnJs.Dex.getDeposit(quoteAddress, account),
        ]);
      }

      const [total, base, quote, rate, baseDeposited, quoteDeposited] = result.map(v => BalancedJs.utils.toIcx(v));

      changePool(poolId, {
        baseCurrencyKey: pair.baseCurrencyKey,
        quoteCurrencyKey: pair.quoteCurrencyKey,
        base: base,
        quote: quote,
        baseDeposited: baseDeposited,
        quoteDeposited: quoteDeposited,
        total: total,
        rate: rate,
        inverseRate: ONE.div(rate),
      });
    },
    [changePool, networkId, account],
  );

  React.useEffect(() => {
    SUPPORTED_PAIRS.forEach(pair => fetchPool(pair));
  }, [fetchPool, transactions, networkId]);

  // fetch LP token balances

  const { changeBalance, clearBalances } = useBalanceActionHandlers();

  React.useEffect(() => {
    if (account) {
      SUPPORTED_PAIRS.forEach(pair => {
        const poolId = pair.poolId;
        if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
          Promise.all([bnJs.Dex.getICXBalance(account), bnJs.Dex.getSicxEarnings(account)]).then(([res1, res2]) => {
            changeBalance(poolId, {
              baseCurrencyKey: pair.baseCurrencyKey,
              quoteCurrencyKey: pair.quoteCurrencyKey,
              balance: BalancedJs.utils.toIcx(res1),
              balance1: BalancedJs.utils.toIcx(res2),
            });
          });
        } else {
          bnJs.Dex.balanceOf(account, poolId).then(res => {
            changeBalance(poolId, {
              baseCurrencyKey: pair.baseCurrencyKey,
              quoteCurrencyKey: pair.quoteCurrencyKey,
              balance: BalancedJs.utils.toIcx(res),
            });
          });
        }
      });
    } else {
      clearBalances();
    }
  }, [account, transactions, changeBalance, clearBalances]);
}

export function usePools() {
  return useSelector((state: AppState) => state.pool.pools);
}

export function usePool(poolId: number): Pool | undefined {
  const pools = usePools();
  return pools[poolId];
}

export function useBalances() {
  return useSelector((state: AppState) => state.pool.balances);
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
  const balance: Balance | undefined = balances[poolId];
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
