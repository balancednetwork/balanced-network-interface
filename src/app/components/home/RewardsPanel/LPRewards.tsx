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
import Spinner from 'app/components/Spinner';
import Tooltip from 'app/components/Tooltip';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useLPReward } from 'queries/reward';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useBBalnAmount, useDynamicBBalnAmount, useSources, useTotalSupply } from 'store/bbaln/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
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
  const isSmall = useMedia('(max-width: 1050px)');
  const isExtraSmall = useMedia('(max-width: 800px)');

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
      {t`Your positions require`} <strong>{`${bBalnAmount?.plus(maxRewardThreshold).toFormat(2)} bBALN`}</strong>{' '}
      {t`for maximum rewards.`}
    </>
  ) : (
    <Trans>You receive maximum rewards for your position.</Trans>
  );

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
            summary: t`Claimed loans & liquidity rewards.`,
            pending: t`Claiming loans & liquidity rewards...`,
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
        <Flex justifyContent="space-between" mb={3}>
          <Typography variant="h4" fontWeight="bold" fontSize={14} color="text">
            <Tooltip
              show={showGlobalTooltip && !isExtraSmall}
              text={
                <>
                  <Typography>{maxRewardNoticeContent}</Typography>
                  <PositionRewardsInfo />
                </>
              }
              placement="bottom-end"
              forcePlacement={isSmall}
              width={320}
              offset={[0, 19]}
            >
              Balanced incentives
            </Tooltip>
          </Typography>
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
          <Typography fontSize={14} opacity={0.75} maxWidth={'220px'} mb={5}>
            Take out a loan or supply liquidity to earn BALN
          </Typography>
        )}
      </Box>

      <Modal isOpen={isOpen} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb={1}>
            <Trans>Claim loans & liquidity rewards?</Trans>
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

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
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
