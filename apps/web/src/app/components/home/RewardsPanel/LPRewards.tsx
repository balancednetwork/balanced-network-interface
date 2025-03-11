import React, { useMemo } from 'react';

import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';

import { UnderlineText } from '@/app/components/DropdownText';
import { QuestionWrapper } from '@/app/components/QuestionHelper';
import Tooltip from '@/app/components/Tooltip';
import { Typography } from '@/app/theme';
import QuestionIcon from '@/assets/icons/question.svg';
import { useLPRewards } from '@/queries/reward';
import { useBBalnAmount, useDynamicBBalnAmount, useIncentivisedSources, useTotalSupply } from '@/store/bbaln/hooks';
import { getXChainType, useXAccount } from '@balancednetwork/xwagmi';

import { useSavingsXChainId } from '@/store/savings/hooks';
import ClaimLPRewardsModal from './ClaimLPRewardsModal';
import PositionRewardsInfo from './PositionRewardsInfo';
import RewardsGrid from './RewardsGrid';

const LPRewards = ({ showGlobalTooltip }: { showGlobalTooltip: boolean }) => {
  const savingsXChainId = useSavingsXChainId();
  const xAccount = useXAccount(getXChainType(savingsXChainId));
  const account = xAccount?.address;

  const { data: lpRewards } = useLPRewards();
  const rewards = useMemo(() => lpRewards?.[savingsXChainId], [lpRewards, savingsXChainId]);

  const [isOpen, setOpen] = React.useState(false);

  const sources = useIncentivisedSources();
  const totalSupplyBBaln = useTotalSupply();
  const dynamicBBalnAmount = useDynamicBBalnAmount();
  const bBalnAmount = useBBalnAmount();
  const isSmall = useMedia('(max-width: 1050px)');
  const isExtraSmall = useMedia('(max-width: 800px)');
  const [tooltipHovered, setTooltipHovered] = React.useState(false);

  // TODO: review this logic if numberOfPositions is needed
  const numberOfPositions = React.useMemo(
    () => (sources ? Object.values(sources).filter(source => source.balance.isGreaterThan(100)).length : 0),
    [sources],
  );

  const maxRewardThreshold = React.useMemo(() => {
    if (sources && totalSupplyBBaln && bBalnAmount) {
      return BigNumber.max(
        ...Object.values(sources).map(source =>
          source.supply.isGreaterThan(0)
            ? source.balance
                .times(totalSupplyBBaln)
                .minus(bBalnAmount.times(source.supply))
                .dividedBy(source.supply.minus(source.balance))
            : new BigNumber(0),
        ),
      );
    } else {
      return new BigNumber(0);
    }
  }, [sources, totalSupplyBBaln, bBalnAmount]);

  const maxRewardNoticeContent = dynamicBBalnAmount.isLessThan(bBalnAmount?.plus(maxRewardThreshold)) ? (
    <>
      {numberOfPositions > 1 ? t`Your positions require` : t`Your position requires`}{' '}
      <strong>{`${bBalnAmount
        ?.plus(maxRewardThreshold)
        .toFormat(bBalnAmount.plus(maxRewardThreshold).isGreaterThan(100) ? 0 : 2)} bBALN`}</strong>{' '}
      {t`for maximum rewards.`}
    </>
  ) : (
    <Trans>You receive maximum rewards for your position.</Trans>
  );

  return (
    <>
      <Box width="100%">
        <Flex justifyContent="space-between" mb={3} alignItems="center">
          <Flex flexWrap="wrap">
            <Typography
              variant="h4"
              fontWeight="bold"
              mr={'8px'}
              fontSize={16}
              color="text"
              style={{ whiteSpace: 'nowrap' }}
            >
              <Tooltip
                show={
                  savingsXChainId === '0x1.icon' &&
                  ((!!numberOfPositions && showGlobalTooltip && !isExtraSmall) ||
                    (!!numberOfPositions && isExtraSmall && tooltipHovered))
                }
                text={
                  <>
                    <Typography>{maxRewardNoticeContent}</Typography>
                    <PositionRewardsInfo />
                  </>
                }
                placement="bottom-end"
                forcePlacement={isSmall}
                width={330}
                offset={[0, 19]}
              >
                Liquidity rewards
                {/* {isExtraSmall && account && !!numberOfPositions && (
                  <QuestionWrapper
                    style={{ transform: 'translateY(1px)', marginLeft: '8px' }}
                    onMouseEnter={() => setTooltipHovered(true)}
                    onMouseLeave={() => setTooltipHovered(false)}
                    onTouchStart={() => setTooltipHovered(true)}
                    onTouchCancel={() => setTooltipHovered(false)}
                  >
                    <QuestionIcon width={14} />
                  </QuestionWrapper>
                )} */}
              </Tooltip>
            </Typography>
          </Flex>
          {rewards?.some(reward => reward.greaterThan(0)) && (
            <UnderlineText>
              <Typography color="primaryBright" onClick={() => setOpen(true)}>
                <Trans>Claim</Trans>
              </Typography>
            </UnderlineText>
          )}
        </Flex>
        {rewards?.some(reward => reward.greaterThan(0)) ? (
          <RewardsGrid rewards={rewards} />
        ) : (
          <Typography fontSize={14} opacity={0.75} mb={5}>
            Supply liquidity on the Trade page to earn BALN rewards.
          </Typography>
        )}
      </Box>

      <ClaimLPRewardsModal isOpen={isOpen} onClose={() => setOpen(false)} />
    </>
  );
};

export default LPRewards;
