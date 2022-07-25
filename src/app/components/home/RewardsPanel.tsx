import React from 'react';

import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { t, Trans } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { useMedia } from 'react-use';
import { Flex, Box } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import QuestionHelper from 'app/components/QuestionHelper';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { ZERO } from 'constants/index';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useActiveLocale } from 'hooks/useActiveLocale';
import { useRewardQuery } from 'queries/reward';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useFetchUnclaimedDividends, useUnclaimedFees } from 'store/fees/hooks';
import { useHasNetworkFees } from 'store/reward/hooks';
import { TransactionStatus, useTransactionAdder, useTransactionStatus } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX } from 'store/wallet/hooks';
import { parseUnits } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

import ModalContent from '../ModalContent';
import Spinner from '../Spinner';

//show only fees greater then 0.01
const MIN_AMOUNT_TO_SHOW = CurrencyAmount.fromRawAmount(
  SUPPORTED_TOKENS_MAP_BY_ADDRESS[bnJs.bnUSD.address],
  parseUnits('1', 16),
);

const RewardsPanel = () => {
  useFetchUnclaimedDividends();
  const locale = useActiveLocale();
  const shouldBreakOnMobile = useMedia('(max-width: 499px)') && 'en-US,ko-KR'.indexOf(locale) < 0;

  return (
    <div>
      <BoxPanel bg="bg2">
        <Flex alignItems="center" justifyContent="space-between" mb={5}>
          <Typography variant="h2">
            <Trans>Rewards</Trans>
          </Typography>
        </Flex>

        <Flex flexDirection={shouldBreakOnMobile ? 'column' : 'row'}>
          <RewardSection shouldBreakOnMobile={shouldBreakOnMobile} />
          <NetworkFeeSection shouldBreakOnMobile={shouldBreakOnMobile} />
        </Flex>
      </BoxPanel>
    </div>
  );
};

export default RewardsPanel;

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
        setRewardTx(res.result);
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

  const { data: reward, refetch } = useRewardQuery();

  const [rewardTx, setRewardTx] = React.useState('');
  const rewardTxStatus = useTransactionStatus(rewardTx);
  React.useEffect(() => {
    if (rewardTxStatus === TransactionStatus.success) refetch();
  }, [rewardTxStatus, refetch]);

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
    } else if (reward?.isGreaterThan(0.01)) {
      return (
        <>
          <Typography variant="p">
            {`${reward?.dp(2).toFormat()} `}
            <Typography as="span" color="text1">
              BALN
            </Typography>
          </Typography>
          <Button mt={2} onClick={toggleOpen}>
            <Trans>Claim</Trans>
          </Button>
        </>
      );
    } else {
      return (
        <Typography variant="p" as="div" textAlign={'center'} padding={shouldBreakOnMobile ? '0' : '0 10px'}>
          <Trans>Pending</Trans>
        </Typography>
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
      <Typography variant="p" mb={2} textAlign={'center'} padding={shouldBreakOnMobile ? '0' : '0 10px'}>
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

          <Typography textAlign="center">
            <Trans>To earn network fees, stake BALN from your wallet.</Trans>
          </Typography>

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
            Object.keys(fees)
              .filter(key => fees[key].greaterThan(MIN_AMOUNT_TO_SHOW))
              .map(key => (
                <Typography key={key} variant="p">
                  {`${fees[key].toFixed(2)}`}{' '}
                  <Typography key={key} as="span" color="text1">
                    {fees[key].currency.symbol}
                  </Typography>
                </Typography>
              ))}

          {fees && Object.keys(fees).filter(key => fees[key].greaterThan(MIN_AMOUNT_TO_SHOW)).length ? (
            <Button mt={2} onClick={toggleOpen}>
              <Trans>Claim</Trans>
            </Button>
          ) : (
            <Typography variant="p" as="div" textAlign={'center'} padding={shouldBreakOnMobile ? '0' : '0 10px'}>
              <Trans>Pending</Trans>
            </Typography>
          )}
        </>
      );
    } else {
      return (
        <Typography variant="p" as="div" textAlign={'center'} padding={shouldBreakOnMobile ? '0' : '0 10px'}>
          <Trans>Ineligible</Trans>
          <QuestionHelper text={t`To earn network fees, stake BALN from your wallet.`} />
        </Typography>
      );
    }
  };

  return (
    <Flex flex={1} flexDirection="column" alignItems={shouldBreakOnMobile ? 'start' : 'center'}>
      <Typography variant="p" mb={2} as="div" textAlign={'center'} padding={shouldBreakOnMobile ? '0' : '0 10px'}>
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
              Object.keys(fees)
                .filter(key => fees[key].greaterThan(MIN_AMOUNT_TO_SHOW))
                .map(key => (
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
