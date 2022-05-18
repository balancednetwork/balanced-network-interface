import React from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';
import Nouislider from 'nouislider-react';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD, ZERO } from 'constants/index';
import { useActiveLocale } from 'hooks/useActiveLocale';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX } from 'store/wallet/hooks';
import { parseUnits } from 'utils';
import { showMessageOnBeforeUnload } from 'utils/messages';

dayjs.extend(localizedFormat);

export default React.memo(function StakePanel() {
  const details = useBALNDetails();

  const shouldLedgerSign = useShouldLedgerSign();

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const totalBalance: BigNumber = React.useMemo(() => details['Total balance'] || ZERO, [details]);

  const stakedBalance: BigNumber = React.useMemo(() => details['Staked balance'] || ZERO, [details]);

  const [isAdjusting, setAdjusting] = React.useState(false);
  const handleAdjust = () => {
    setAdjusting(true);
  };
  const handleCancel = () => {
    setAdjusting(false);
  };

  const [stakedPercent, setStakedPercent] = React.useState(
    totalBalance.isZero() ? ZERO : stakedBalance.dividedBy(totalBalance).times(100),
  );

  const handleSlide = React.useCallback(
    (values: string[], handle: number) => {
      setStakedPercent(new BigNumber(values[handle]));
    },
    [setStakedPercent],
  );

  React.useEffect(() => {
    if (!isAdjusting) {
      setStakedPercent(!totalBalance.isZero() ? stakedBalance.dividedBy(totalBalance).multipliedBy(100) : ZERO);
    }
  }, [stakedBalance, isAdjusting, totalBalance]);

  // modal
  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const beforeAmount = stakedBalance;
  const afterAmount = stakedPercent.multipliedBy(totalBalance).div(100);
  const differenceAmount = afterAmount.minus(beforeAmount);
  const shouldStake = differenceAmount.isPositive();

  const addTransaction = useTransactionAdder();

  const { account } = useIconReact();

  const handleConfirm = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .BALN.stake(parseUnits(afterAmount.toString()))
      .then(res => {
        if (res.result) {
          if (shouldStake) {
            addTransaction(
              { hash: res.result },
              {
                pending: t`Staking BALN...`,
                summary: t`Staked ${differenceAmount.abs().dp(2).toFormat()} BALN.`,
              },
            );
          } else {
            addTransaction(
              { hash: res.result },
              {
                pending: t`Unstaking BALN...`,
                summary: t`Unstaked ${differenceAmount.abs().dp(2).toFormat()} BALN.`,
              },
            );
          }
          toggleOpen();
          handleCancel();
        } else {
          console.error(res);
        }
      })
      .finally(() => {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  const locale = useActiveLocale();
  const languageCode = locale.split('-')[0];

  const date = dayjs().add(3, 'days');
  const description = shouldStake
    ? t`Unstaking takes 3 days.`
    : t`They'll unstake on ${date && dayjs(date).locale(languageCode).format('ll')}, around ${
        date && dayjs(date).locale(languageCode).format('LT')
      }.`;

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <Typography variant="h3">
        <Trans>Stake Balance Tokens</Trans>
      </Typography>

      <Typography my={1}>
        <Trans>Stake your Balance Tokens to earn network fees.</Trans>
      </Typography>

      <Box my={3}>
        <Nouislider
          disabled={!isAdjusting}
          id="slider-collateral"
          start={[stakedBalance.dividedBy(totalBalance).multipliedBy(100).dp(2).toNumber()]}
          padding={[0]}
          connect={[true, false]}
          range={{
            min: [0],
            max: [totalBalance.dp(2).isZero() ? SLIDER_RANGE_MAX_BOTTOM_THRESHOLD : 100],
          }}
          onSlide={handleSlide}
        />
      </Box>

      <Flex my={1} alignItems="center" justifyContent="space-between">
        <Typography>
          {stakedPercent.multipliedBy(totalBalance).div(100).dp(2).toFormat()} / {totalBalance.dp(2).toFormat()}
        </Typography>
        <Typography>
          <Trans>{stakedPercent.dp(2, BigNumber.ROUND_UP).toFormat()}% staked</Trans>
        </Typography>
      </Flex>

      <Flex alignItems="center" justifyContent="center" mt={5}>
        {!isAdjusting ? (
          <Button onClick={handleAdjust}>
            <Trans>Adjust</Trans>
          </Button>
        ) : (
          <>
            <TextButton onClick={handleCancel}>
              <Trans>Cancel</Trans>
            </TextButton>
            <Button onClick={toggleOpen}>
              <Trans>Confirm</Trans>
            </Button>
          </>
        )}
      </Flex>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb="5px">
            {shouldStake ? t`Stake Balance Tokens?` : t`Unstake Balance Tokens?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(2).toFormat() + ' BALN'}
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

          <Typography textAlign="center">{description}</Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button onClick={handleConfirm} fontSize={14} disabled={!hasEnoughICX}>
                  {shouldStake ? t`Stake` : t`Unstake`}
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
});
