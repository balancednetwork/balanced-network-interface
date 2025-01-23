import React, { useEffect, useCallback, useMemo } from 'react';

import Nouislider from '@/packages/nouislider-react';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD, ZERO } from '@/constants/index';
import { Pool, usePoolTokenAmounts } from '@/hooks/useV2Pairs';
import { useAllPairsById } from '@/queries/backendv2';
import { useIncentivisedPairs, useRatesWithOracle } from '@/queries/reward';
import { useBBalnAmount, useSources, useTotalSupply } from '@/store/bbaln/hooks';
import { useRewards } from '@/store/reward/hooks';
import { useChangeStakedLPPercent, useStakedLPPercent } from '@/store/stakedLP/hooks';
import { formatBigNumber } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import {
  getNetworkDisplayName,
  getXChainType,
  useXAccount,
  useXStakeLPToken,
  useXUnstakeLPToken,
} from '@balancednetwork/xwagmi';

import Skeleton from '@/app/components/Skeleton';
import { useEvmSwitchChain } from '@/hooks/useEvmSwitchChain';
import useXCallGasChecker from '@/hooks/useXCallGasChecker';
import { formatValue } from '@/utils/formatter';
import { Fraction } from '@balancednetwork/sdk-core';
import { getFormattedExternalRewards, getFormattedRewards, stakedFraction } from '../utils';
import { getExternalShareReward, getShareReward } from './WithdrawPanel';

export default function StakeLPPanel({ pool }: { pool: Pool }) {
  const { poolId, pair, balance: lpBalance, stakedLPBalance } = pool;
  const sources = useSources();
  const { data: allPairs } = useAllPairsById();
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
  const toggleOpen = () => {
    setOpen(!open);
  };

  const beforeAmount = stakedBalance;
  const afterAmount = stakedPercent.multipliedBy(totalStaked).div(100);
  const differenceAmount = afterAmount.minus(beforeAmount?.toFixed() || ZERO);
  const shouldStake = differenceAmount.isPositive();

  const xStakeLPToken = useXStakeLPToken();
  const xUnstakeLPToken = useXUnstakeLPToken();
  const xAccount = useXAccount(getXChainType(pool.xChainId));

  const handleConfirm = async () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    try {
      const decimals = Math.ceil((pair.token0.decimals + pair.token1.decimals) / 2);
      if (shouldStake) {
        await xStakeLPToken(xAccount.address, poolId, pool.xChainId, differenceAmount.toFixed(), decimals);
      } else {
        console.log('differenceAmount.toFixed()', differenceAmount.toFixed());
        await xUnstakeLPToken(xAccount.address, poolId, pool.xChainId, differenceAmount.abs().toFixed(), decimals);
      }

      toggleOpen();
      handleCancel();
    } catch (e) {
      console.error(e);
    }

    window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
  };

  const description = shouldStake ? "You'll earn BALN until you unstake them." : "You'll stop earning BALN from them.";

  const upSmall = useMedia('(min-width: 800px)');
  const prices = useRatesWithOracle();
  const rewards = useRewards();
  const [aBalance, bBalance] = usePoolTokenAmounts(pool);
  const pairName = `${aBalance.currency.symbol || '...'}/${bBalance.currency.symbol || '...'}`;
  const sourceName = pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName;
  const totalReward = rewards[sourceName];
  const stakedFractionValue = stakedFraction(stakedPercent);
  const totalBbaln = useTotalSupply();
  const userBbaln = useBBalnAmount();

  // TODO: understand and rewrite to support crosschain
  const reward = getShareReward(
    totalReward,
    sources && sources[sourceName],
    pool,
    stakedFractionValue,
    totalBbaln,
    userBbaln,
  );

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

  const RespoRewardsInfo = () => {
    // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
    const totalAPR = useMemo(() => {
      let balnAndFeesAPR = new BigNumber(0);
      if (allPairs && sources && sources[sourceName].balance.isGreaterThan(0)) {
        balnAndFeesAPR = new BigNumber(allPairs[pair.poolId!].balnApy)
          .times(sources[sourceName].workingBalance.dividedBy(sources[sourceName].balance))
          .plus(allPairs[poolId].feesApy)
          .times(100);
      } else if (allPairs && allPairs[poolId].feesApy) {
        balnAndFeesAPR = new BigNumber(allPairs[poolId].feesApy).times(100);
      }

      let totalAPR = balnAndFeesAPR;
      if (externalRewards.length > 0 && allPairs && allPairs[poolId]?.externalRewardsTotalAPR) {
        totalAPR = totalAPR.plus(allPairs[poolId]?.externalRewardsTotalAPR);
      }

      return totalAPR;
    }, [pair, allPairs, sources, sourceName, poolId]);

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
  };

  const { isWrongChain, handleSwitchChain } = useEvmSwitchChain(pool.xChainId);
  const gasChecker = useXCallGasChecker(pool.xChainId, undefined);

  return (
    <Box width={upSmall ? 1 / 2 : 1}>
      {!upSmall && <RespoRewardsInfo />}
      <Typography variant="h3" marginBottom="15px">
        Stake LP tokens
      </Typography>
      {isIncentivised ? (
        <>
          <Typography my={1}>Stake your LP tokens to earn BALN from this liquidity pool.</Typography>

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
                <Button onClick={toggleOpen}>Confirm</Button>
              </>
            )}
          </Flex>

          <Modal isOpen={open} onDismiss={toggleOpen}>
            <ModalContent noMessages>
              <Typography textAlign="center" mb="5px">
                {shouldStake ? 'Stake LP tokens?' : 'Unstake LP tokens?'}
              </Typography>
              <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
                {differenceAmount.abs().dp(2).toFormat()}
              </Typography>
              <Flex my={5}>
                <Box width={1 / 2} className="border-right">
                  <Typography textAlign="center">Before</Typography>
                  <Typography variant="p" textAlign="center">
                    {beforeAmount.dp(2).toFormat()}
                  </Typography>
                </Box>

                <Box width={1 / 2}>
                  <Typography textAlign="center">After</Typography>
                  <Typography variant="p" textAlign="center">
                    {afterAmount.dp(2).toFormat()}
                  </Typography>
                </Box>
              </Flex>
              <Typography textAlign="center">{description}</Typography>
              <Flex justifyContent="center" mt={4} pt={4} className="border-top">
                <TextButton onClick={toggleOpen} fontSize={14}>
                  Cancel
                </TextButton>
                {isWrongChain ? (
                  <Button onClick={handleSwitchChain} fontSize={14}>
                    <Trans>Switch to</Trans>
                    {` ${getNetworkDisplayName(pool.xChainId)}`}
                  </Button>
                ) : (
                  <Button onClick={handleConfirm} fontSize={14} disabled={!gasChecker.hasEnoughGas}>
                    {shouldStake ? 'Stake' : 'Unstake'}
                  </Button>
                )}
              </Flex>
              {!gasChecker.hasEnoughGas && (
                <Flex justifyContent="center" paddingY={2}>
                  <Typography maxWidth="320px" color="alert" textAlign="center">
                    {gasChecker.errorMessage}
                  </Typography>
                </Flex>
              )}
            </ModalContent>
          </Modal>
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
    </Box>
  );
}
