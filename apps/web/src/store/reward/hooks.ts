import { Fraction } from '@balancednetwork/sdk-core';
import { UseQueryResult, keepPreviousData, useQuery } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';

import bnJs from '@/bnJs';

export type RewardDistributionRaw = {
  Base: Map<string, Fraction>;
  Fixed: Map<string, Fraction>;
  Voting: Map<string, Fraction>;
};

export type RewardDistribution = {
  Base: Map<string, Fraction>;
  Fixed: Map<string, Fraction>;
  Voting: Map<string, Fraction>;
};

const WEIGHT_CONST = 10 ** 18;

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
