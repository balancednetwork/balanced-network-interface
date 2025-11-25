import React, { useMemo } from 'react';

import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { Box, Flex } from 'rebass/styled-components';

import Skeleton from '@/app/components/Skeleton';
import { Typography } from '@/app/theme';
import { Pool, usePoolTokenAmounts } from '@/hooks/useV2Pairs';
import { useAllPairsById } from '@/queries/backendv2';
import { useIncentivisedPairs, useRatesWithOracle } from '@/queries/reward';
import { useBBalnAmount, useSources, useTotalSupply } from '@/store/bbaln/hooks';
import { useRewards } from '@/store/reward/hooks';
import { useStakedLPPercent } from '@/store/stakedLP/hooks';
import { formatValue } from '@/utils/formatter';
import { getFormattedExternalRewards, getFormattedRewards, stakedFraction } from '../utils';
import { getExternalShareReward, getShareReward } from './WithdrawPanel';

export default function RespoRewardsInfo({ pool }: { pool: Pool }) {
  const { poolId, pair } = pool;
  const prices = useRatesWithOracle();

  const { data: allPairs } = useAllPairsById();
  const sources = useSources();
  const [aBalance, bBalance] = usePoolTokenAmounts(pool);
  const pairName = `${aBalance.currency.symbol || '...'}/${bBalance.currency.symbol || '...'}`.replace('(old)', '');
  const sourceName = pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName;
  const { data: incentivisedPairs } = useIncentivisedPairs();
  const isIncentivised = useMemo(
    () =>
      incentivisedPairs &&
      !!incentivisedPairs.find(pair => pair.name === (pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName)),
    [incentivisedPairs, pairName],
  );

  const pairData = useMemo(() => {
    return allPairs?.[pair.poolId!];
  }, [allPairs, pair.poolId]);

  const externalRewards = useMemo(() => {
    if (!isIncentivised || !pairData) {
      return [];
    }
    return pairData.externalRewards || [];
  }, [isIncentivised, pairData]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  const totalAPR = useMemo(() => {
    let balnAndFeesAPR = new BigNumber(0);
    if (allPairs && sources) {
      const feesApy = allPairs[poolId]?.feesApy || 0;
      balnAndFeesAPR = sources[sourceName].balance.isZero()
        ? new BigNumber(feesApy).times(100)
        : new BigNumber(allPairs[pair.poolId!].balnApy)
            .times(sources[sourceName].workingBalance.dividedBy(sources[sourceName].balance))
            .plus(feesApy)
            .times(100);
    }

    let totalAPR = balnAndFeesAPR;
    if (externalRewards.length > 0 && allPairs && allPairs[poolId]?.externalRewardsTotalAPR) {
      totalAPR = totalAPR.plus(allPairs[poolId]?.externalRewardsTotalAPR);
    }

    return totalAPR;
  }, [pair, allPairs, sources, sourceName, poolId]);

  // TODO: understand and rewrite to support crosschain
  const rewards = useRewards();
  const totalReward = rewards[sourceName];
  const stakedPercent = useStakedLPPercent(poolId);
  const stakedFractionValue = stakedFraction(stakedPercent);
  const totalBbaln = useTotalSupply();
  const userBbaln = useBBalnAmount();
  const reward = getShareReward(
    totalReward,
    sources && sources[sourceName],
    pool,
    stakedFractionValue,
    totalBbaln,
    userBbaln,
  );

  return (
    <Flex
      marginBottom={4}
      justifyContent="space-between"
      paddingBottom={4}
      sx={{ borderBottom: '1px solid rgba(255, 255, 255, 0.15)' }}
    >
      <Box>
        <Typography color="text2">
          <Trans>Daily rewards</Trans>
        </Typography>
        <Typography color="text" fontSize={16}>
          {getFormattedRewards(reward, externalRewards.length === 0)}
        </Typography>
        {externalRewards.map(reward => {
          const rewardPrice = prices?.[reward.currency.wrapped.symbol];
          const rewardShare = getExternalShareReward(reward, pool, stakedFractionValue, pairData?.stakedLP);
          return (
            <Typography key={reward.currency.symbol} color="text" fontSize={16}>
              {getFormattedExternalRewards(rewardShare, rewardPrice?.toFixed())}
            </Typography>
          );
        })}
      </Box>

      <Box sx={{ textAlign: 'right' }}>
        <Typography color="text2">
          <Trans>APR</Trans>
        </Typography>
        <Typography color="text" fontSize={16}>
          {!allPairs || !sources ? (
            <Skeleton width={100}></Skeleton>
          ) : sources[sourceName] ? (
            `${formatValue(totalAPR.toFixed(2), false)}%`
          ) : (
            '-'
          )}
        </Typography>
      </Box>
    </Flex>
  );
}
