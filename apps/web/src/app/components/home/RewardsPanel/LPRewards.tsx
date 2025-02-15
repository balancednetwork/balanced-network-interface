import React from 'react';

import { useIconReact } from '@/packages/icon-react';
import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from '@/app/components/Button';
import { UnderlineText } from '@/app/components/DropdownText';
import Modal from '@/app/components/Modal';
import ModalContent from '@/app/components/ModalContent';
import { QuestionWrapper } from '@/app/components/QuestionHelper';
import Tooltip from '@/app/components/Tooltip';
import { Typography } from '@/app/theme';
import QuestionIcon from '@/assets/icons/question.svg';
import { useLPReward } from '@/queries/reward';
import { useBBalnAmount, useDynamicBBalnAmount, useIncentivisedSources, useTotalSupply } from '@/store/bbaln/hooks';
import { useTransactionAdder } from '@/store/transactions/hooks';
import { useHasEnoughICX } from '@/store/wallet/hooks';
import { showMessageOnBeforeUnload } from '@/utils/messages';
import { bnJs } from '@balancednetwork/xwagmi';

import PositionRewardsInfo from './PositionRewardsInfo';
import RewardsGrid from './RewardsGrid';

const LPRewards = ({ showGlobalTooltip }: { showGlobalTooltip: boolean }) => {
  const { data: rewards } = useLPReward();
  const [isOpen, setOpen] = React.useState(false);
  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();
  const sources = useIncentivisedSources();
  const totalSupplyBBaln = useTotalSupply();
  const dynamicBBalnAmount = useDynamicBBalnAmount();
  const bBalnAmount = useBBalnAmount();
  const hasEnoughICX = useHasEnoughICX();
  const isSmall = useMedia('(max-width: 1050px)');
  const isExtraSmall = useMedia('(max-width: 800px)');
  const [tooltipHovered, setTooltipHovered] = React.useState(false);
  const numberOfPositions = React.useMemo(
    () => (sources ? Object.values(sources).filter(source => source.balance.isGreaterThan(100)).length : 0),
    [sources],
  );

  const toggleOpen = React.useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen]);

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

  const handleClaim = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    bnJs
      .inject({ account })
      .Rewards.claimRewards()
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            summary: t`Claimed liquidity rewards.`,
            pending: t`Claiming liquidity rewards...`,
          },
        );
        toggleOpen();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

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
                  (!!numberOfPositions && showGlobalTooltip && !isExtraSmall) ||
                  (!!numberOfPositions && isExtraSmall && tooltipHovered)
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
                {isExtraSmall && account && !!numberOfPositions && (
                  <QuestionWrapper
                    style={{ transform: 'translateY(1px)', marginLeft: '8px' }}
                    onMouseEnter={() => setTooltipHovered(true)}
                    onMouseLeave={() => setTooltipHovered(false)}
                    onTouchStart={() => setTooltipHovered(true)}
                    onTouchCancel={() => setTooltipHovered(false)}
                  >
                    <QuestionIcon width={14} />
                  </QuestionWrapper>
                )}
              </Tooltip>
            </Typography>
          </Flex>
          {rewards?.some(reward => reward.greaterThan(0)) && (
            <UnderlineText>
              <Typography color="primaryBright" onClick={toggleOpen}>
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

      <Modal isOpen={isOpen} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb={1}>
            <Trans>Claim liquidity rewards?</Trans>
          </Typography>

          <Flex flexDirection="column" alignItems="center" mt={2}>
            {rewards?.map((reward, index) => (
              <Typography key={index} variant="p">
                {`${reward.toFixed(2, { groupSeparator: ',' })}`}{' '}
                <Typography as="span" color="text1">
                  {reward.currency.symbol}
                </Typography>
              </Typography>
            ))}
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              <Trans>Not now</Trans>
            </TextButton>
            <Button onClick={handleClaim} fontSize={14} disabled={!hasEnoughICX}>
              <Trans>Claim</Trans>
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default LPRewards;
