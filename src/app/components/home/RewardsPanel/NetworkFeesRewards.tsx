import React from 'react';

import { Trans, t } from '@lingui/macro';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass';

import { Button, TextButton } from 'app/components/Button';
import { UnderlineText } from 'app/components/DropdownText';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import QuestionHelper, { QuestionWrapper } from 'app/components/QuestionHelper';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useBBalnAmount, useDBBalnAmountDiff, usePastMonthFeesDistributed, useTotalSupply } from 'store/bbaln/hooks';
import { useUnclaimedFees } from 'store/fees/hooks';
// import { useHasNetworkFees } from 'store/reward/hooks';
import { useHasNetworkFees } from 'store/reward/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import RewardsGrid from './RewardsGrid';

const NetworkFeesReward = () => {
  // const hasNetworkFees = useHasNetworkFees();
  const rewards = useUnclaimedFees();
  const { account } = useIconReact();
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const hasEnoughICX = useHasEnoughICX();
  const [isOpen, setOpen] = React.useState(false);
  const { data: pastMonthFees } = usePastMonthFeesDistributed();
  const totalSupplyBBaln = useTotalSupply();
  const bBalnAmount = useBBalnAmount();
  const bbalnAmountDiff = useDBBalnAmountDiff();
  const hasNetworkFees = useHasNetworkFees();

  const toggleOpen = React.useCallback(() => {
    setOpen(!isOpen);
  }, [isOpen]);

  const handleClaim = () => {
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
            summary: t`Claimed network fees.`,
            pending: t`Claiming network fees...`,
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
    <Box width="100%">
      <Flex justifyContent="space-between" mb={3}>
        <Typography variant="h4" fontWeight="bold" fontSize={14} color="text">
          Network fees
          <QuestionWrapper style={{ transform: 'translateY(1px)' }}>
            <QuestionHelper
              text={
                <>
                  {hasNetworkFees && (
                    <Trans>
                      Your share{' '}
                      {!bBalnAmount.isEqualTo(0) && (
                        <strong>
                          (
                          {totalSupplyBBaln
                            ? `${bBalnAmount.dividedBy(totalSupplyBBaln).times(100).toPrecision(3)} %`
                            : '-'}
                          ){' '}
                        </strong>
                      )}
                      of the fees distributed to bBALN holders, calculated with Your bBALN ÷ Total bBALN.
                    </Trans>
                  )}

                  {pastMonthFees && (
                    <Typography mt={hasNetworkFees ? 2 : 0} color="text1">
                      <>
                        <strong style={{ color: '#FFFFFF' }}>${pastMonthFees.total.toFormat(0)} </strong>
                        {t`was distributed over the last 30 days`}
                      </>
                      {totalSupplyBBaln && bBalnAmount && bbalnAmountDiff && bBalnAmount.isGreaterThan(0) ? (
                        <>
                          {t`, so you would have received`}{' '}
                          <strong>{t`$${pastMonthFees?.total
                            .times(bBalnAmount.plus(bbalnAmountDiff).dividedBy(totalSupplyBBaln.plus(bbalnAmountDiff)))
                            .toFormat(2)}.`}</strong>
                        </>
                      ) : (
                        '.'
                      )}
                    </Typography>
                  )}
                </>
              }
            />
          </QuestionWrapper>
        </Typography>
        {hasNetworkFees && (
          <UnderlineText>
            <Typography color="primaryBright" onClick={toggleOpen}>
              <Trans>Claim</Trans>
            </Typography>
          </UnderlineText>
        )}
      </Flex>
      {hasNetworkFees ? (
        <RewardsGrid rewards={Object.values(rewards)} />
      ) : (
        <Typography fontSize={14} opacity={0.75} maxWidth={'220px'} mb={5}>
          Lock up BALN to earn fees from Balanced transactions.
        </Typography>
      )}

      <Modal isOpen={isOpen} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb={1}>
            <Trans>Claim network fees?</Trans>
          </Typography>

          <Flex flexDirection="column" alignItems="center" mt={2}>
            {Object.values(rewards).map((reward, index) => (
              <Typography key={index} variant="p">
                {`${reward.toFixed(2, { groupSeparator: ',' })}`}{' '}
                <Typography as="span" color="text1">
                  {reward.currency.symbol}
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
                <Button onClick={handleClaim} fontSize={14} disabled={!hasEnoughICX}>
                  <Trans>Claim</Trans>
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </Box>
  );
};
export default NetworkFeesReward;
