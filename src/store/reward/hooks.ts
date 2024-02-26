import React, { useEffect } from 'react';

import { Fraction } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useQuery, UseQueryResult } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import bnJs from 'bnJs';
import { PLUS_INFINITY } from 'constants/index';
import { useTokenPrices } from 'queries/backendv2';
import { useLPReward } from 'queries/reward';
import { useBBalnAmount, useDynamicBBalnAmount, useSources } from 'store/bbaln/hooks';
import { useCollateralInputAmountAbsolute } from 'store/collateral/hooks';
import { useHasUnclaimedFees } from 'store/fees/hooks';
import { WEIGHT_CONST } from 'store/liveVoting/hooks';
import { RewardDistribution, RewardDistributionRaw } from 'store/liveVoting/types';
import { useLoanInputAmount } from 'store/loan/hooks';
import { useOraclePrice } from 'store/oracle/hooks';
import { useLockedAmount, useUnclaimedRewards } from 'store/savings/hooks';
import { useAllTransactions } from 'store/transactions/hooks';

import { AppState } from '..';
import { setReward } from './actions';

export function useRewards(): AppState['reward'] {
  return useSelector((state: AppState) => state.reward);
}

export function useTotalLPRewards(): BigNumber {
  const rewards = useRewards();
  return Object.keys(rewards).reduce((total, rewardId) => {
    try {
      if (rewardId.indexOf('/') > 0) {
        total = total.plus(rewards[rewardId]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      return total;
    }
  }, new BigNumber(0));
}

export function useReward(rewardName: string): BigNumber | undefined {
  const rewards = useRewards();
  if (rewardName && rewards[rewardName] && rewards[rewardName].isGreaterThan(0)) {
    return rewards[rewardName];
  }
}

export function useChangeReward(): (poolId: string, reward: BigNumber) => void {
  const dispatch = useDispatch();

  return React.useCallback(
    (poolId, reward) => {
      dispatch(setReward({ poolId, reward }));
    },
    [dispatch],
  );
}

export function useEmissions() {
  return useQuery(
    'getEmissions',
    async () => {
      const data = await bnJs.Rewards.getEmission();
      return new BigNumber(data).div(10 ** 18);
    },
    {
      keepPreviousData: true,
      refetchOnReconnect: false,
      refetchInterval: undefined,
    },
  );
}

export function useFetchRewardsInfo() {
  const { data: emission } = useEmissions();
  const { data: distribution } = useFlattenedRewardsDistribution();
  const changeReward = useChangeReward();

  useEffect(() => {
    if (distribution && emission) {
      Object.keys(distribution).forEach(rewardName => {
        try {
          changeReward(rewardName, emission.times(new BigNumber(distribution[rewardName].toFixed(18))));
        } catch (e) {
          console.error(e);
        }
      });
    }
  }, [distribution, emission, changeReward]);
}

export const useCurrentCollateralRatio = (): BigNumber => {
  const collateralInputAmount = useCollateralInputAmountAbsolute();
  const loanInputAmount = useLoanInputAmount();
  const oraclePrice = useOraclePrice();

  return React.useMemo(() => {
    if (loanInputAmount.isZero() || !collateralInputAmount || !oraclePrice) return PLUS_INFINITY;

    return collateralInputAmount.times(oraclePrice).dividedBy(loanInputAmount).multipliedBy(100);
  }, [collateralInputAmount, loanInputAmount, oraclePrice]);
};

export const useHasNetworkFees = () => {
  const { account } = useIconReact();
  const hasUnclaimedFees = useHasUnclaimedFees();
  const bbalnAmount = useBBalnAmount();
  const transactions = useAllTransactions();
  const [hasNetworkFees, setHasNetworkFees] = React.useState(false);

  React.useEffect(() => {
    const checkIfHasNetworkFees = async () => {
      if (account && bbalnAmount) {
        if (bbalnAmount.isGreaterThan(0) || hasUnclaimedFees) setHasNetworkFees(true);
        else setHasNetworkFees(false);
      }
    };

    checkIfHasNetworkFees();
  }, [account, transactions, hasUnclaimedFees, bbalnAmount]);

  return hasNetworkFees;
};

export function useRewardsPercentDistribution(): UseQueryResult<RewardDistribution, Error> {
  return useQuery('rewardDistribution', async () => {
    const data: RewardDistributionRaw = await bnJs.Rewards.getDistributionPercentages();

    return {
      Base: Object.keys(data.Base).reduce((distributions, item) => {
        try {
          distributions[item] = new Fraction(data.Base[item], WEIGHT_CONST);
        } catch (e) {
          console.error(e);
        } finally {
          return distributions;
        }
      }, {}),
      Fixed: Object.keys(data.Fixed).reduce((distributions, item) => {
        try {
          distributions[item] = new Fraction(data.Fixed[item], WEIGHT_CONST);
        } catch (e) {
          console.error(e);
        } finally {
          return distributions;
        }
      }, {}),
      Voting: Object.keys(data.Voting).reduce((distributions, item) => {
        try {
          distributions[item] = new Fraction(data.Voting[item], WEIGHT_CONST);
        } catch (e) {
          console.error(e);
        } finally {
          return distributions;
        }
      }, {}),
    };
  });
}

export function useFlattenedRewardsDistribution(): UseQueryResult<Map<string, Fraction>, Error> {
  const { data: distribution } = useRewardsPercentDistribution();

  return useQuery(
    ['flattenedDistribution', distribution],
    () => {
      if (distribution) {
        return Object.values(distribution).reduce((flattened, dist) => {
          return Object.keys(dist).reduce((flattened, item) => {
            if (Object.keys(flattened).indexOf(item) >= 0) {
              flattened[item] = flattened[item].add(dist[item]);
            } else {
              flattened[item] = dist[item];
            }
            return flattened;
          }, flattened);
        }, {});
      }
    },
    {
      keepPreviousData: true,
    },
  );
}

export function useEarnedPastMonth(): UseQueryResult<BigNumber | undefined> {
  const { account } = useIconReact();
  const { data: prices } = useTokenPrices();

  return useQuery(
    `earnedPastMonth-${account}-${prices ? Object.keys(prices).length : '0'}`,
    async () => {
      if (account) {
        //todo: after endpoint is ready, fetch the data from there
        return new BigNumber(23.9);
      }
    },
    {
      enabled: !!account,
      keepPreviousData: true,
    },
  );
}

export function useHasAnyKindOfRewards() {
  const dynamicBBalnAmount = useDynamicBBalnAmount();
  const bnUSDDeposit = useLockedAmount();
  const sources = useSources();
  const hasUnclaimedFees = useHasUnclaimedFees();
  const { data: reward } = useLPReward();
  const { data: savingsRewards } = useUnclaimedRewards();

  const numberOfPositions = React.useMemo(
    () => (sources ? Object.values(sources).filter(source => source.balance.isGreaterThan(100)).length : 0),
    [sources],
  );

  return (
    hasUnclaimedFees ||
    reward?.greaterThan(0) ||
    savingsRewards?.some(reward => reward.greaterThan(0)) ||
    dynamicBBalnAmount.isGreaterThan(0) ||
    bnUSDDeposit?.greaterThan(0) ||
    numberOfPositions > 0
  );
}
