import React from 'react';

import { Trans, t } from '@lingui/macro';
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
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import {
  useBBalnSliderState,
  useDBBalnAmountDiff,
  useDynamicBBalnAmount,
  usePastMonthFeesDistributed,
  useTotalSupply,
} from 'store/bbaln/hooks';
import { useFetchUnclaimedDividends, useUnclaimedFees } from 'store/fees/hooks';
import { useHasNetworkFees } from 'store/reward/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

import RewardsGrid from './RewardsGrid';

const NetworkFeesReward = ({ showGlobalTooltip }: { showGlobalTooltip: boolean }) => {
  useFetchUnclaimedDividends();
  const rewards = useUnclaimedFees();
  const { account } = useIconReact();
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const hasEnoughICX = useHasEnoughICX();
  const [isOpen, setOpen] = React.useState(false);
  const { data: pastMonthFees } = usePastMonthFeesDistributed();
  const totalSupplyBBaln = useTotalSupply();
  const dynamicBalnAmount = useDynamicBBalnAmount();
  const bbalnAmountDiff = useDBBalnAmountDiff();
  const hasNetworkFees = useHasNetworkFees();
  const { isAdjusting } = useBBalnSliderState();
  const [tooltipHovered, setTooltipHovered] = React.useState(false);
  const isSmallScreen = useMedia('(max-width: 800px)');

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

  const feeShare = React.useMemo(() => {
    if (!totalSupplyBBaln) return;
    return dynamicBalnAmount.dividedBy(totalSupplyBBaln.plus(bbalnAmountDiff));
  }, [totalSupplyBBaln, dynamicBalnAmount, bbalnAmountDiff]);

  return (
    <Box width="100%">
      <Flex justifyContent="space-between" mb={3} alignItems="center">
        <Flex alignItems="center">
          <Typography variant="h4" fontWeight="bold" fontSize={16} color="text">
            <span style={{ paddingRight: '8px' }}>
              <Trans>Network fees</Trans>
            </span>
          </Typography>
          <Tooltip
            text={
              account && dynamicBalnAmount.isGreaterThan(0) ? (
                <>
                  <Trans>
                    {isAdjusting ? t`You'll` : t`You`} receive{' '}
                    {!dynamicBalnAmount.isEqualTo(0) ? (
                      <strong>
                        {dynamicBalnAmount.isEqualTo(0)
                          ? 'N/A'
                          : totalSupplyBBaln && feeShare
                          ? `${feeShare.times(100).toPrecision(3)}%`
                          : '-'}{' '}
                      </strong>
                    ) : (
                      <strong>0% </strong>
                    )}
                    of the fees shared with bBALN holders
                  </Trans>
                  {feeShare ? (
                    <>
                      , equivalent to <strong> {t`$${pastMonthFees?.total.times(feeShare).toFormat(2)}`}</strong> over
                      the last 30 days.
                    </>
                  ) : (
                    '.'
                  )}
                </>
              ) : (
                <>
                  {t`bBALN holders received`}{' '}
                  <strong style={{ color: '#FFFFFF' }}>${pastMonthFees?.total.toFormat(0) ?? '-'} </strong>
                  {t`from network fees in the last 30 days.`}
                </>
              )
            }
            show={tooltipHovered || (!isSmallScreen && showGlobalTooltip)}
            placement="bottom"
            width={300}
            forcePlacement={true}
          >
            <QuestionWrapper
              style={{ transform: 'translateY(1px)' }}
              onMouseEnter={() => setTooltipHovered(true)}
              onMouseLeave={() => setTooltipHovered(false)}
              onTouchStart={() => setTooltipHovered(true)}
              onTouchCancel={() => setTooltipHovered(false)}
            >
              <QuestionIcon width={14} />
            </QuestionWrapper>
          </Tooltip>
        </Flex>

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
        <Typography fontSize={14} opacity={0.75} mb={5}>
          To earn fees from Balanced transactions, lock up BALN.
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
