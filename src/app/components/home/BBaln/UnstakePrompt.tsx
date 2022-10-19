import React from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import Spinner from 'app/components/Spinner';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useChangeShouldLedgerSign, useShouldLedgerSign } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useHasEnoughICX } from 'store/wallet/hooks';
import { showMessageOnBeforeUnload } from 'utils/messages';

const UnstakePrompt = ({
  stakedBalance,
  availableBalance,
}: {
  stakedBalance: BigNumber;
  availableBalance: BigNumber;
}) => {
  const shouldLedgerSign = useShouldLedgerSign();
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const addTransaction = useTransactionAdder();
  const hasEnoughICX = useHasEnoughICX();
  const { account } = useIconReact();

  const [open, setOpen] = React.useState(false);
  const toggleOpen = () => {
    if (shouldLedgerSign) return;
    setOpen(!open);
  };

  const handleConfirm = () => {
    window.addEventListener('beforeunload', showMessageOnBeforeUnload);

    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    bnJs
      .inject({ account })
      .BALN.stake('0')
      .then(res => {
        if (res.result) {
          addTransaction(
            { hash: res.result },
            {
              pending: t`Unstaking BALN...`,
              summary: t`${stakedBalance.dp(2).toFormat()} BALN added to your wallet.`,
            },
          );
          toggleOpen();
        } else {
          console.error(res);
        }
      })
      .finally(() => {
        changeShouldLedgerSign(false);
        window.removeEventListener('beforeunload', showMessageOnBeforeUnload);
      });
  };

  return (
    <>
      <Typography
        textAlign={['left', 'left', 'left', 'center']}
        color="text"
        fontWeight={700}
        fontSize={16}
        mt={6}
        mb={2}
      >
        <Trans>BALN staking has been upgraded to a lock-up model called Boosted BALN.</Trans>
      </Typography>
      <Typography textAlign={['left', 'left', 'left', 'center']} color="text2">
        <Trans>
          Unstake your BALN, then lock it up for 1 week – 4 years. You'll receive bBALN, which determines your voting
          power, network fee earnings, and BALN rewards.
        </Trans>
      </Typography>
      <Typography textAlign={['left', 'left', 'left', 'center']}>
        <Button onClick={toggleOpen} mt={3}>
          <Trans>Unstake BALN</Trans>
        </Button>
      </Typography>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent>
          <Typography textAlign="center" mb="5px">
            {t`Unstake BALN?`}
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {stakedBalance.dp(2).toFormat() + ' BALN'}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {availableBalance.dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {availableBalance.plus(stakedBalance).dp(2).toFormat() + ' BALN'}
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">
            <Trans>You'll receive BALN in your wallet immediately</Trans>
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            {shouldLedgerSign && <Spinner></Spinner>}
            {!shouldLedgerSign && (
              <>
                <TextButton onClick={toggleOpen} fontSize={14}>
                  <Trans>Cancel</Trans>
                </TextButton>
                <Button onClick={handleConfirm} fontSize={14} disabled={!hasEnoughICX}>
                  {t`Unstake BALN`}
                </Button>
              </>
            )}
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
};

export default UnstakePrompt;
