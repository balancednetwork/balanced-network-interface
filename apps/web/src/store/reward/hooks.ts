import React, { useCallback, useEffect, useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { CurrencyAmount, Fraction, Token, XChainId } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import { PLUS_INFINITY } from '@/constants/index';
import { useAllPairs } from '@/queries/backendv2';
import { calculateTotal, useLPRewards, useRatesWithOracle } from '@/queries/reward';
import { useBBalnAmount, useDynamicBBalnAmount, useSources } from '@/store/bbaln/hooks';
import { useCollateralInputAmountAbsolute } from '@/store/collateral/hooks';
import { useHasUnclaimedFees, useUnclaimedFees } from '@/store/fees/hooks';
import { WEIGHT_CONST } from '@/store/liveVoting/hooks';
import { RewardDistribution, RewardDistributionRaw } from '@/store/liveVoting/types';
import { useLoanInputAmount } from '@/store/loan/hooks';
import { useOraclePrice } from '@/store/oracle/hooks';
import { useLockedAmount, useUnclaimedRewards } from '@/store/savings/hooks';
import { useAllTransactions } from '@/store/transactions/hooks';
import { bnJs, getXChainType, useXAccount, useXLockedBnUSDAmount } from '@balancednetwork/xwagmi';

import { AppState } from '..';
import { setReward } from './reducer';
import { usePoolPanelContext } from '@/app/pages/trade/supply/_components/PoolPanelContext';

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

export function useExternalRewards(rewardName: string): CurrencyAmount<Token>[] | undefined {
  const { data: allPairs } = useAllPairs();

  return allPairs?.find(pair => pair.name === rewardName)?.externalRewards;
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
  return useQuery({
    queryKey: ['getEmissions'],
    queryFn: async () => {
      const data = await bnJs.Rewards.getEmission();
      return new BigNumber(data).div(10 ** 18);
    },
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
    refetchInterval: undefined,
  });
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
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
  return useQuery({
    queryKey: ['rewardDistribution'],
    queryFn: async () => {
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
    },
  });
}

export function useFlattenedRewardsDistribution(): UseQueryResult<Map<string, Fraction>, Error> {
  const { data: distribution } = useRewardsPercentDistribution();

  return useQuery({
    queryKey: ['flattenedDistribution', distribution],
    queryFn: () => {
      if (!distribution) return;

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
    },
    enabled: !!distribution,
    placeholderData: keepPreviousData,
  });
}

export function useHasAnyKindOfRewards(xChainId: XChainId) {
  const dynamicBBalnAmount = useDynamicBBalnAmount();

  const xAccount = useXAccount(getXChainType(xChainId));
  const { data: bnUSDDeposit } = useXLockedBnUSDAmount({
    address: xAccount?.address,
    xChainId: xChainId,
  });
  const { data: lpRewards } = useLPRewards();
  const { data: savingsRewards } = useUnclaimedRewards();
  const { data: feesRewards } = useUnclaimedFees();

  const { pools } = usePoolPanelContext();

  const isStaked = useCallback(
    (xChainId: XChainId) => {
      if (!pools) {
        return false;
      }
      return pools.some(pool => pool.xChainId === xChainId && Number(pool.stakedLPBalance?.toFixed()) > 0);
    },
    [pools],
  );

  const rates = useRatesWithOracle();

  return useMemo(() => {
    if (!xAccount?.address) return false;

    if (xChainId === '0x1.icon') {
      return (
        bnUSDDeposit?.greaterThan(0) ||
        dynamicBBalnAmount.isGreaterThan(0) ||
        (lpRewards?.[xChainId] && calculateTotal(lpRewards?.[xChainId], rates).gt(0)) ||
        (savingsRewards?.[xChainId] && calculateTotal(savingsRewards?.[xChainId], rates).gt(0)) ||
        (feesRewards?.[xChainId] && calculateTotal(feesRewards?.[xChainId], rates).gt(0)) ||
        isStaked(xChainId)
      );
    } else {
      return (
        bnUSDDeposit?.greaterThan(0) ||
        (lpRewards?.[xChainId] && calculateTotal(lpRewards?.[xChainId], rates).gt(0)) ||
        (savingsRewards?.[xChainId] && calculateTotal(savingsRewards?.[xChainId], rates).gt(0)) ||
        (feesRewards?.[xChainId] && calculateTotal(feesRewards?.[xChainId], rates).gt(0)) ||
        isStaked(xChainId)
      );
    }
  }, [xAccount, xChainId, lpRewards, savingsRewards, rates, dynamicBBalnAmount, bnUSDDeposit, isStaked, feesRewards]);
}
