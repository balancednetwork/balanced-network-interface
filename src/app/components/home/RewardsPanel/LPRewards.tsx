import React from 'react';

import { Trans, t } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from 'app/components/Button';
import { UnderlineText } from 'app/components/DropdownText';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import { QuestionWrapper } from 'app/components/QuestionHelper';
import Spinner from 'app/components/Spinner';
import Tooltip from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import { ReactComponent as QuestionIcon } from 'assets/icons/question.svg';
import bnJs from 'bnJs';
import { useLPReward } from 'queries/reward';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useBBalnAmount, useDynamicBBalnAmount, useSources, useTotalSupply } from 'store/bbaln/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX, useICONWalletBalances } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import PositionRewardsInfo from './PositionRewardsInfo';
import RewardsGrid from './RewardsGrid';

const LPRewards = ({ showGlobalTooltip }: { showGlobalTooltip: boolean }) => {
  const { data: reward } = useLPReward();
  const [isOpen, setOpen] = React.useState(false);
  const { account } = useIconReact();
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const sources = useSources();
  const totalSupplyBBaln = useTotalSupply();
  const dynamicBBalnAmount = useDynamicBBalnAmount();
  const bBalnAmount = useBBalnAmount();
  const hasEnoughICX = useHasEnoughICX();
  const balances = useICONWalletBalances();
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

  const balnBalance = balances?.[bnJs.BALN.address];

  const handleClaim = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .Rewards.claimRewards()
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            summary: t`Claimed Balanced incentives.`,
            pending: t`Claiming Balanced incentives...`,
          },
        );
        toggleOpen();
      })
      .catch(e => {
        console.error('error', e);
      })
      .finally(() => {
        changeShouldLedgerSign(false);
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
                Balanced incentives
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
          {reward?.greaterThan(0) && (
            <UnderlineText>
              <Typography color="primaryBright" onClick={toggleOpen}>
                <Trans>Claim</Trans>
              </Typography>
            </UnderlineText>
          )}
        </Flex>
        {reward?.greaterThan(0) ? (
          <RewardsGrid rewards={[reward]} />
        ) : (
          <Typography fontSize={14} opacity={0.75} mb={5}>
            To earn BALN, borrow bnUSD or supply liquidity on the Trade page.
          </Typography>
        )}
      </Box>

      <Modal isOpen={isOpen} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb={1}>
            <Trans>Claim Balanced incentives?</Trans>
          </Typography>

          <Flex flexDirection="column" alignItems="center" mt={2}>
            {reward && (
              <Typography variant="p">
                {`${reward.toFixed(2, { groupSeparator: ',' })}`}{' '}
                <Typography as="span" color="text1">
                  {reward.currency.symbol}
                </Typography>
              </Typography>
            )}
          </Flex>

          <Flex my={'25px'}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {balnBalance?.toFixed(2, { groupSeparator: ',' }) || 0} BALN
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {reward && `${balnBalance.add(reward).toFixed(2, { groupSeparator: ',' })} BALN`}
              </Typography>
            </Box>
          </Flex>

          <Flex justifyContent="center" pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Not now</Trans>
                </TextButton>
                <Button onClick={handleClaim} fontSize={14} disabled={!hasEnoughICX}>
                  <Trans>Claim</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default LPRewards;
