import React from 'react';

import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import Nouislider from 'nouislider-react';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyBalanceErrorMessage from 'app/components/CurrencyBalanceErrorMessage';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SLIDER_RANGE_MAX_BOTTOM_THRESHOLD, ZERO } from 'constants/index';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useBALNDetails, useHasEnoughICX } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

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
      .inject({ account: account })
      .BALN.stake(BalancedJs.utils.toLoop(afterAmount))
      .then(res => {
        if (res.result) {
          if (shouldStake) {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Staking BALN tokens...',
                summary: `Staked ${differenceAmount.abs().dp(2).toFormat()} BALN tokens.`,
              },
            );
          } else {
            addTransaction(
              { hash: res.result },
              {
                pending: 'Unstaking BALN tokens...',
                summary: `Unstaked ${differenceAmount.abs().dp(2).toFormat()} BALN tokens.`,
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

  const date = dayjs().add(3, 'days');
  const description = shouldStake
    ? 'Unstaking takes 3 days.'
    : `They'll unstake on ${date && dayjs(date).format('MMM D')}, around ${date && dayjs(date).format('h:ma')}.`;

  const hasEnoughICX = useHasEnoughICX();

  return (
    <>
      <Typography variant="h3">Stake Balance Tokens</Typography>

      <Typography my={1}>Stake your Balance Tokens to earn network fees.</Typography>

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
        <Typography>{stakedPercent.dp(2, BigNumber.ROUND_UP).toFormat()}% staked</Typography>
      </Flex>

      <Flex alignItems="center" justifyContent="center" mt={5}>
        {!isAdjusting ? (
          <Button onClick={handleAdjust}>Adjust</Button>
        ) : (
          <>
            <TextButton onClick={handleCancel}>Cancel</TextButton>
            <Button onClick={toggleOpen}>Confirm</Button>
          </>
        )}
      </Flex>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            {shouldStake ? 'Stake Balance Tokens?' : 'Unstake Balance Tokens?'}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(2).toFormat() + ' BALN'}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
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
                  Cancel
                </TextButton>
                <Button onClick={handleConfirm} fontSize={14} disabled={!hasEnoughICX}>
                  {shouldStake ? 'Stake' : 'Unstake'}
                </Button>
              </>
            )}
          </Flex>

          <LedgerConfirmMessage />

          {!hasEnoughICX && <CurrencyBalanceErrorMessage mt={3} />}
        </Flex>
      </Modal>
    </>
  );
});
