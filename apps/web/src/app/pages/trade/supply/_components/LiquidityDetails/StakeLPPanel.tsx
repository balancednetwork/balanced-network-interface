import React, { useEffect, useCallback, useMemo } from 'react';

import Nouislider from '@/packages/nouislider-react';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import { Typography } from '@/app/theme';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD, ZERO } from '@/constants/index';
import { Pool, usePoolTokenAmounts } from '@/hooks/useV2Pairs';
import { useIncentivisedPairs } from '@/queries/reward';
import { useChangeStakedLPPercent, useStakedLPPercent } from '@/store/stakedLP/hooks';
import { formatBigNumber } from '@/utils';
import RespoRewardsInfo from './RespoRewardsInfo';
import StakeLPModal from './StakeLPModal';

export default function StakeLPPanel({ pool }: { pool: Pool }) {
  const { poolId, balance: lpBalance, stakedLPBalance } = pool;
  const { data: incentivisedPairs } = useIncentivisedPairs();

  const stakedBalance = useMemo(() => new BigNumber(stakedLPBalance?.toFixed() || 0), [stakedLPBalance]);

  // TODO: rename to totalLPBalance
  const totalStaked = new BigNumber(stakedBalance.toFixed()).plus(lpBalance.toFixed());

  const onStakedLPPercentSelected = useChangeStakedLPPercent();
  const stakedPercent = useStakedLPPercent(poolId);

  const [isAdjusting, setAdjusting] = React.useState(false);
  const handleAdjust = () => {
    setAdjusting(true);
  };
  const handleCancel = () => {
    setAdjusting(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    onStakedLPPercentSelected(
      poolId,
      totalStaked.isZero() ? ZERO : stakedBalance.dividedBy(totalStaked).multipliedBy(100),
    );
  }, [onStakedLPPercentSelected, poolId, stakedBalance.toFixed(), totalStaked.toFixed()]);

  const handleSlide = useCallback(
    (values: string[], handle: number) => {
      onStakedLPPercentSelected(poolId, new BigNumber(values[handle]));
    },
    [onStakedLPPercentSelected, poolId],
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    if (!isAdjusting) {
      onStakedLPPercentSelected(
        poolId,
        !totalStaked.isZero() ? stakedBalance.dividedBy(totalStaked).multipliedBy(100) : ZERO,
      );
    }
  }, [onStakedLPPercentSelected, isAdjusting, totalStaked.toFixed(), poolId, stakedBalance.toFixed()]);

  // modal
  const [open, setOpen] = React.useState(false);

  const beforeAmount = stakedBalance;
  const afterAmount = stakedPercent.multipliedBy(totalStaked).div(100);

  const upSmall = useMedia('(min-width: 800px)');
  const [aBalance, bBalance] = usePoolTokenAmounts(pool);
  const pairName = `${aBalance.currency.symbol || '...'}/${bBalance.currency.symbol || '...'}`;

  const isIncentivised = useMemo(
    () =>
      incentivisedPairs &&
      !!incentivisedPairs.find(pair => pair.name === (pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName)),
    [incentivisedPairs, pairName],
  );

  return (
    <Box width={upSmall ? 1 / 2 : 1}>
      {!upSmall && <RespoRewardsInfo pool={pool} />}
      <Typography variant="h3" marginBottom="15px">
        Stake LP tokens
      </Typography>
      {isIncentivised ? (
        <>
          <Typography my={1}>Stake your LP tokens to earn rewards from this liquidity pool.</Typography>

          <Box my={3}>
            <Nouislider
              disabled={!isAdjusting}
              id="slider-collateral"
              start={[stakedBalance.dividedBy(totalStaked).multipliedBy(100).dp(2).toNumber()]}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [totalStaked.dp(2).isZero() ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD : 100],
              }}
              onSlide={handleSlide}
            />
          </Box>

          <Flex my={1} alignItems="center" justifyContent="space-between">
            <Typography>
              {formatBigNumber(stakedPercent.multipliedBy(totalStaked).div(100), 'currency')} /{' '}
              {formatBigNumber(totalStaked, 'currency')} LP tokens
            </Typography>
          </Flex>

          <Flex alignItems="center" justifyContent="center" mt={5}>
            {!isAdjusting ? (
              <Button onClick={handleAdjust}>Adjust stake</Button>
            ) : (
              <>
                <TextButton onClick={handleCancel}>Cancel</TextButton>
                <Button onClick={() => setOpen(true)}>Confirm</Button>
              </>
            )}
          </Flex>
        </>
      ) : (
        <Typography my={1}>
          You have
          <Typography as="span" fontWeight="bold" color="white">
            {` ${formatBigNumber(totalStaked, 'currency')} LP tokens`}
          </Typography>
          . You may be able to stake them on another platform to earn more rewards.
        </Typography>
      )}

      <StakeLPModal
        isOpen={open}
        onClose={() => setOpen(false)}
        beforeAmount={beforeAmount}
        afterAmount={afterAmount}
        pool={pool}
        onSuccess={handleCancel}
      />
    </Box>
  );
}
