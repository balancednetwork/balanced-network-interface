import React, { useEffect, useCallback, useMemo } from 'react';

import { useIconReact } from '@/packages/icon-react';
import Nouislider from '@/packages/nouislider-react';
import { Pair } from '@balancednetwork/v1-sdk';
import { Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from '@/app/components/Button';
import CurrencyBalanceErrorMessage from '@/app/components/CurrencyBalanceErrorMessage';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { Typography } from '@/app/theme';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD, ZERO } from '@/constants/index';
import { useBalance } from '@/hooks/useV2Pairs';
import { useAllPairsById } from '@/queries/backendv2';
import { useIncentivisedPairs } from '@/queries/reward';
import { useBBalnAmount, useSources, useTotalSupply } from '@/store/bbaln/hooks';
import { useRewards } from '@/store/reward/hooks';
import { useChangeStakedLPPercent, useStakedLPPercent, useTotalStaked } from '@/store/stakedLP/hooks';
import { useTransactionAdder } from '@/store/transactions/hooks';
import { useHasEnoughICX } from '@/store/wallet/hooks';
import { formatBigNumber, parseUnits } from '@/utils';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import bnJs from '@/xwagmi/xchains/icon/bnJs';

import Skeleton from '@/app/components/Skeleton';
import { getFormattedRewards, stakedFraction } from '../utils';
import { getABBalance, getShareReward } from './WithdrawPanel';

export default function StakeLPPanel({ pair }: { pair: Pair }) {
  const { account } = useIconReact();
  const poolId = pair.poolId!;
  const sources = useSources();
  const { data: allPairs } = useAllPairsById();
  const { data: incentivisedPairs } = useIncentivisedPairs();

  const balance = useBalance(poolId);
  const stakedBalance = useMemo(
    () => new BigNumber(balance?.stakedLPBalance?.toFixed() || 0),
    [balance?.stakedLPBalance],
  );

  const totalStaked = useTotalStaked(poolId);

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

  const addTransaction = useTransactionAdder();

  const handleConfirm = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    const decimals = (pair.token0.decimals + pair.token1.decimals) / 2;
    if (shouldStake) {
      bnJs
        .inject({ account: account })
        .Dex.stake(poolId, parseUnits(differenceAmount.toFixed(), decimals))
        .then(res => {
          if (res.result) {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Staking LP tokens...',
                summary: `Staked ${differenceAmount.abs().dp(2).toFormat()} LP tokens.`,
              },
            );

            toggleOpen();
            handleCancel();
          } else {
            console.error(res);
          }
        })
        .finally(() => {
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
    } else {
      bnJs
        .inject({ account: account })
        .StakedLP.unstake(poolId, parseUnits(differenceAmount.abs().toFixed(), decimals))
        .then(res => {
          if (res.result) {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Unstaking LP tokens...',
                summary: `Unstaked ${differenceAmount.abs().dp(2).toFormat()} LP tokens.`,
              },
            );

            toggleOpen();
            handleCancel();
          } else {
            console.error(res);
          }
        })
        .finally(() => {
          window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
        });
    }
  };

  const description = shouldStake ? "You'll earn BALN until you unstake them." : "You'll stop earning BALN from them.";

  const hasEnoughICX = useHasEnoughICX();

  const upSmall = useMedia('(min-width: 800px)');

  const rewards = useRewards();
  const [aBalance, bBalance] = getABBalance(pair, balance);
  const pairName = `${aBalance.currency.symbol || '...'}/${bBalance.currency.symbol || '...'}`;
  const sourceName = pairName === 'sICX/BTCB' ? 'BTCB/sICX' : pairName;
  const totalReward = rewards[sourceName];
  const stakedFractionValue = stakedFraction(stakedPercent);
  const totalBbaln = useTotalSupply();
  const userBbaln = useBBalnAmount();
  const reward = getShareReward(
    totalReward,
    sources && sources[sourceName],
    balance,
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

  const RespoRewardsInfo = () => {
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
            {getFormattedRewards(reward)}
          </Typography>
        </Box>

        <Box sx={{ textAlign: 'right' }}>
          <Typography color="text2">
            <Trans>APR</Trans>
          </Typography>
          <Typography color="text" fontSize={16}>
            {!allPairs || !sources ? (
              <Skeleton width={100}></Skeleton>
            ) : sources[sourceName] ? (
              `${new BigNumber(allPairs[pair.poolId!].balnApy)
                .times(sources[sourceName].workingBalance.dividedBy(sources[sourceName].balance))
                .plus(allPairs[poolId].feesApy)
                .times(100)
                .toFormat(2)}%`
            ) : (
              '-'
            )}
          </Typography>
        </Box>
      </Flex>
    );
  };

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
            <ModalContent>
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
                <Button onClick={handleConfirm} fontSize={14} disabled={!hasEnoughICX}>
                  {shouldStake ? 'Stake' : 'Unstake'}
                </Button>
              </Flex>

              {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
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
