import { Fraction } from '@balancednetwork/sdk-core';
import BigNumber from 'bignumber.js';
import { useFlattenedRewardsDistribution } from '@/queries';
import { keepPreviousData, useQuery } from '@tanstack/react-query';

import bnJs from '@/bnJs';

export const CHART_COLORS = ['#2ca9b7', '#217f94', '#144a68', '#1694b8', '#136aa1'];

export function useBALNDistributionQuery() {
  const { data: distribution, isSuccess: distributionQuerySuccess } = useFlattenedRewardsDistribution();

  return useQuery({
    queryKey: [`BALNDistribution`, distribution],
    queryFn: () => {
      if (!distribution) return [];

      const liquidityTotal = Object.entries(distribution).reduce((acc, [key, value]) => {
        if (key.indexOf('/') > 0) {
          return acc.add(value);
        }
        return acc;
      }, new Fraction(0));

      return [
        {
          name: 'Liquidity',
          value: parseFloat(liquidityTotal.toFixed(4)),
          fill: CHART_COLORS[0],
        },
        {
          name: 'Reserve Fund',
          value: parseFloat(distribution['Reserve Fund'].toFixed(4)),
        },
        {
          name: 'DAO Fund',
          value: parseFloat(distribution['DAOfund'].toFixed(4)),
          fill: CHART_COLORS[3],
        },
        {
          name: 'Workers',
          value: parseFloat(distribution['Worker Tokens'].toFixed(4)),
          fill: CHART_COLORS[2],
        },
        {
          name: 'Borrowers',
          value: parseFloat(distribution['Loans'].toFixed(4)),
          fill: CHART_COLORS[1],
        },
      ];
    },
    placeholderData: keepPreviousData,
    enabled: distributionQuerySuccess,
  });
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

export function useBALNTotalSupply() {
  return useQuery({
    queryKey: ['getTotalSupply'],
    queryFn: async () => {
      const data = await bnJs.BALN.totalSupply();
      return new BigNumber(data).div(10 ** 18);
    },
    placeholderData: keepPreviousData,
    refetchOnReconnect: false,
    refetchInterval: undefined,
  });
}

export function useBALNLocked() {
  return useQuery({
    queryKey: ['getLocked'],
    queryFn: async () => {
      const data = await bnJs.BBALN.getTotalLocked();
      return new BigNumber(data).div(10 ** 18);
    },
    placeholderData: keepPreviousData,
  });
}

export function useBBALNHolders() {
  return useQuery({
    queryKey: ['getBBALNHolders'],
    queryFn: async () => {
      const data = await bnJs.BBALN.activeUsersCount();
      return new BigNumber(data);
    },
    placeholderData: keepPreviousData,
  });
}

export function useAverageLockUpTime() {
  const { data: totalLocked, isSuccess: isTotalLockedSuccess } = useBALNLocked();
  const maxYearsLocked = new BigNumber(4);

  return useQuery({
    queryKey: [`getAverageLockUpTime${totalLocked ? '' : ''}`],
    queryFn: async () => {
      const totalSupplyRaw = await bnJs.BBALN.totalSupply();
      const totalSupply = new BigNumber(totalSupplyRaw).div(10 ** 18);
      return totalSupply && totalLocked && maxYearsLocked.times(totalSupply.div(totalLocked));
    },
    placeholderData: keepPreviousData,
    enabled: isTotalLockedSuccess,
  });
}

export function useBALNRatioData() {
  const { data: totalSupply, isSuccess: isTotalSupplySuccess } = useBALNTotalSupply();
  const { data: totalLocked, isSuccess: isTotalLockedSuccess } = useBALNLocked();

  return useQuery({
    queryKey: [`getBALNRatioData${totalSupply ? totalSupply : ''}${totalLocked ? totalLocked : ''}`],
    queryFn: () => {
      if (!totalSupply || !totalLocked) return [];
      return [
        {
          name: 'Locked',
          value: parseFloat(totalLocked.toFixed(4)),
          fill: CHART_COLORS[0],
        },
        {
          name: 'Available',
          value: parseFloat(totalSupply.minus(totalLocked).toFixed(4)),
          fill: CHART_COLORS[1],
        },
      ];
    },
    placeholderData: keepPreviousData,
    enabled: isTotalSupplySuccess && isTotalLockedSuccess,
  });
}
