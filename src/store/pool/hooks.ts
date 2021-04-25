import React from 'react';

import BigNumber from 'bignumber.js';
import _ from 'lodash';
import { BalancedJs } from 'packages/BalancedJs';
import addresses from 'packages/BalancedJs/addresses';
import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { Pair, BASE_SUPPORTED_PAIRS } from 'constants/currency';
import { ONE } from 'constants/index';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppDispatch, AppState } from '../index';
import { setBalance, setPair, setPoolData, setReward, clearBalances as clearBalancesCreator } from './actions';
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

export function useChangeReward(): (poolId: number, reward: BigNumber) => void {
  const dispatch = useDispatch<AppDispatch>();

  return React.useCallback(
    (poolId, reward) => {
      dispatch(setReward({ poolId, reward }));
    },
    [dispatch],
  );
}

// fetch pools
export function useFetchPools() {
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

        result = [t, t, t, rate];
      } else {
        result = await Promise.all([
          bnJs.Dex.totalSupply(poolId),
          bnJs.Dex.getPoolTotal(poolId, baseAddress),
          bnJs.Dex.getPoolTotal(poolId, quoteAddress),
          bnJs.Dex.getPrice(poolId),
        ]);
      }

      const [total, base, quote, rate] = result.map(v => BalancedJs.utils.toIcx(v));

      changePool(poolId, {
        baseCurrencyKey: pair.baseCurrencyKey,
        quoteCurrencyKey: pair.quoteCurrencyKey,
        base: base,
        quote: quote,
        total: total,
        rate: rate,
        inverseRate: ONE.div(rate),
      });
    },
    [changePool, networkId],
  );

  React.useEffect(() => {
    BASE_SUPPORTED_PAIRS.forEach(pair => fetchPool(pair));
  }, [fetchPool, transactions, networkId]);

  // fetch rewards rule
  const [rules, setRules] = React.useState({});
  const [emission, setEmission] = React.useState(new BigNumber(0));

  React.useEffect(() => {
    const fetchRewardsRule = async () => {
      let result = await Promise.all([bnJs.Rewards.getRecipientsSplit(), bnJs.Rewards.getEmission()]);

      const [_rules, _emission] = result;

      const a = {};
      _.forOwn(_rules, function (value, key) {
        a[key] = BalancedJs.utils.toIcx(value);
      });

      setRules(a);
      setEmission(BalancedJs.utils.toIcx(_emission));
    };
    fetchRewardsRule();
  }, []);

  const changeReward = useChangeReward();
  // calculate rewards per pool
  React.useEffect(() => {
    BASE_SUPPORTED_PAIRS.forEach(pair => {
      const poolId = pair.poolId;
      let rewardShare: BigNumber;
      if (poolId === BalancedJs.utils.POOL_IDS.sICXICX) {
        rewardShare = rules['sICX/ICX'];
      } else {
        rewardShare = rules[`${pair.baseCurrencyKey}/${pair.quoteCurrencyKey}`];
      }
      changeReward(poolId, emission.times(rewardShare));
    });
  }, [rules, emission, changeReward]);

  // fetch LP token balances
  const { account } = useIconReact();
  const { changeBalance, clearBalances } = useBalanceActionHandlers();

  React.useEffect(() => {
    if (account) {
      BASE_SUPPORTED_PAIRS.forEach(pair => {
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

export function useRewards() {
  return useSelector((state: AppState) => state.pool.rewards);
}

export function useReward(poolId: number): BigNumber | undefined {
  const rewards = useRewards();
  return rewards[poolId];
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

  React.useEffect(() => {
    const fetchAPYs = async () => {
      const [res0, res1, res2, res3] = await Promise.all([
        bnJs.Rewards.getAPY('sICX/ICX'),
        bnJs.Rewards.getAPY('sICX/bnUSD'),
        bnJs.Rewards.getAPY('BALN/bnUSD'),
        bnJs.Rewards.getAPY('Loans'),
      ]);

      setAPYs({
        [BalancedJs.utils.POOL_IDS.sICXICX]: BalancedJs.utils.toIcx(res0),
        [BalancedJs.utils.POOL_IDS.sICXbnUSD]: BalancedJs.utils.toIcx(res1),
        [BalancedJs.utils.POOL_IDS.BALNbnUSD]: BalancedJs.utils.toIcx(res2),
        Loans: BalancedJs.utils.toIcx(res3),
      });
    };

    fetchAPYs();
  }, []);

  return apys;
}
