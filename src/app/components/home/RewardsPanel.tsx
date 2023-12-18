import React from 'react';

import { t, Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { ZERO } from 'constants/index';
import { useActiveLocale } from 'hooks/useActiveLocale';
import { useRewardQuery } from 'queries/reward';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useFetchUnclaimedDividends, useUnclaimedFees } from 'store/fees/hooks';
import { useHasNetworkFees } from 'store/reward/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import LedgerConfirmMessage from '../LedgerConfirmMessage';
import ModalContent from '../ModalContent';
import Spinner from '../Spinner';
import BBalnPanel from './BBaln/BBalnPanel';

export const RewardsPanelLayout = styled(FlexPanel)`
  padding: 0;
  grid-area: initial;
  flex-direction: column;

  ${({ theme }) => theme.mediaWidth.upExtraSmall`
    padding: 0;
  `}

  ${({ theme }) => theme.mediaWidth.upMedium`
    padding: 0;
    grid-column: 1 / span 2;
    flex-direction: row;
  `}
`;

const RewardSection = ({ shouldBreakOnMobile }: { shouldBreakOnMobile: boolean }) => {
  const { account } = useIconReact();
  const addTransaction = useTransactionAdder();
  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const handleRewardClaim = () => {
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
            summary: t`Claimed ${reward?.dp(2).toFormat()} BALN.`,
            pending: t`Claiming rewards...`,
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

  const { data: reward } = useRewardQuery();

  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const getRewardsUI = () => {
    if (reward?.isZero()) {
      return (
        <>
          <Typography variant="p" as="div" textAlign={'center'} padding={shouldBreakOnMobile ? '0' : '0 10px'}>
            <Trans>Ineligible</Trans>
            <QuestionHelper
              text={t`To earn Balanced rewards, take out a loan or supply liquidity on the Trade page.`}
            />
          </Typography>
        </>
      );
    } else {
      return (
        <>
          <Typography variant="p">
            {`${reward?.toFormat(2)} `}
            <Typography as="span" color="text1">
              BALN
            </Typography>
          </Typography>
          <Button mt={3} mx={shouldBreakOnMobile ? 0 : 2} onClick={toggleOpen} fontSize={14}>
            <Trans>Claim</Trans>
          </Button>
        </>
      );
    }
  };

  const hasEnoughICX = useHasEnoughICX();

  const BALNDetails = useBALNDetails();

  const beforeAmount = BALNDetails['Total balance'] || ZERO;

  const afterAmount = beforeAmount.plus(reward || ZERO);

  return (
    <Flex
      flex={1}
      flexDirection="column"
      alignItems={shouldBreakOnMobile ? 'start' : 'center'}
      mb={shouldBreakOnMobile ? '20px' : ''}
      pb={shouldBreakOnMobile ? '20px' : ''}
      className={shouldBreakOnMobile ? 'border-bottom' : 'border-right'}
    >
      <Typography
        variant="p"
        mb={2}
        opacity={0.75}
        fontSize={14}
        textAlign={'center'}
        padding={shouldBreakOnMobile ? '0' : '0 10px'}
      >
        <Trans>Balance Tokens</Trans>
      </Typography>
      {reward && getRewardsUI()}

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb={1}>
            <Trans>Claim Balance Tokens?</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {reward?.dp(2).toFormat() + ' BALN'}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Not now</Trans>
                </TextButton>
                <Button onClick={handleRewardClaim} fontSize={14} disabled={!hasEnoughICX}>
                  <Trans>Claim</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

const NetworkFeeSection = ({ shouldBreakOnMobile }: { shouldBreakOnMobile: boolean }) => {
  const { account } = useIconReact();
  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();

  const handleFeeClaim = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .Dividends.claimDividends()
      .then(res => {
        addTransaction(
          { hash: res.result },
          {
            summary: t`Claimed fees.`,
            pending: t`Claiming fees...`,
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

  const hasNetworkFees = useHasNetworkFees();
  const fees = useUnclaimedFees();

  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    if (shouldLedgerSign) return;

    setOpen(!open);
  };

  const hasEnoughICX = useHasEnoughICX();

  const getNetworkFeesUI = () => {
    if (hasNetworkFees) {
      return (
        <>
          {fees &&
            Object.keys(fees).map(key => (
              <Typography key={key} variant="p">
                {`${fees[key].toFixed(2)}`}{' '}
                <Typography key={key} as="span" color="text1">
                  {fees[key].currency.symbol}
                </Typography>
              </Typography>
            ))}

          <Button mt={2} mx={shouldBreakOnMobile ? 0 : 2} onClick={toggleOpen}>
            <Trans>Claim</Trans>
          </Button>
        </>
      );
    } else {
      return (
        <Typography variant="p" as="div" textAlign={'center'} padding={shouldBreakOnMobile ? '0' : '0 10px'}>
          <Trans>Ineligible</Trans>
          <QuestionHelper text={t`Lock up BALN to earn network fees.`} />
        </Typography>
      );
    }
  };

  return (
    <Flex flex={1} flexDirection="column" alignItems={shouldBreakOnMobile ? 'start' : 'center'}>
      <Typography
        variant="p"
        mb={2}
        opacity={0.75}
        fontSize={14}
        as="div"
        textAlign={'center'}
        padding={shouldBreakOnMobile ? '0' : '0 10px'}
      >
        <Trans>Network fees</Trans>
      </Typography>
      {getNetworkFeesUI()}

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb={1}>
            <Trans>Claim network fees?</Trans>
          </Typography>

          <Flex flexDirection="column" alignItems="center" mt={2}>
            {fees &&
              Object.keys(fees).map(key => (
                <Typography key={key} variant="p">
                  {`${fees[key].toFixed(2)}`}{' '}
                  <Typography key={key} as="span" color="text1">
                    {fees[key].currency.symbol}
                  </Typography>
                </Typography>
              ))}
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Not now</Trans>
                </TextButton>
                <Button onClick={handleFeeClaim} fontSize={14} disabled={!hasEnoughICX}>
                  <Trans>Claim</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </Flex>
  );
};

const RewardsPanel = () => {
  useFetchUnclaimedDividends();
  const locale = useActiveLocale();
  const shouldBreakOnMobile = useMedia('(max-width: 499px)') && 'en-US,ko-KR'.indexOf(locale) < 0;
  return (
    <RewardsPanelLayout bg="bg2" className="js-rewards-panel" mb={'100px'}>
      <BoxPanel bg="bg3" flex={1} maxWidth={['initial', 'initial', 'initial', 350]}>
        <Flex alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h2">
            <Trans>Rewards</Trans>
          </Typography>
        </Flex>

        <Flex flexDirection={shouldBreakOnMobile ? 'column' : 'row'}>
          <RewardSection shouldBreakOnMobile={shouldBreakOnMobile} />
          <NetworkFeeSection shouldBreakOnMobile={shouldBreakOnMobile} />
        </Flex>

        <LedgerConfirmMessage mt={5} />
      </BoxPanel>

      <BBalnPanel />
    </RewardsPanelLayout>
  );
};

export default RewardsPanel;
