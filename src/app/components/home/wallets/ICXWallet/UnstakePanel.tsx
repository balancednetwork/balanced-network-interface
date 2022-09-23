import React from 'react';

import { BalancedJs } from '@balancednetwork/balanced-js';
import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useAllTransactions, useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';
import { toCurrencyAmount } from 'utils';

interface UnstakePanelProps {
  claimableICX: BigNumber;
}

export default function UnstakePanel({ claimableICX }: UnstakePanelProps) {
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const balances = useWalletBalances();

  const icxContractAddress = bnJs.ICX.address;
  const ICX = SUPPORTED_TOKENS_MAP_BY_ADDRESS[icxContractAddress];
  const icxBalance = balances[icxContractAddress];

  const claimableICXCA = toCurrencyAmount(ICX.wrapped, claimableICX);

  // to detect if transaction change and reload cliamableICX
  const transactions = useAllTransactions();

  const { account } = useIconReact();

  // modal logic
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };
  const addTransaction = useTransactionAdder();

  const handleUnstake = async () => {
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    try {
      const res = await bnJs.inject({ account }).Staking.claimICX();
      toggleOpen();
      addTransaction(
        { hash: res.result },
        {
          pending: t`Claiming ICX...`,
          summary: t`Claimed ${claimableICX.toNumber()} ICX.`,
        },
      );
    } catch (ex) {}

    changeShouldLedgerSign(false);
  };

  const [unstakingAmount, setUnstakingAmount] = React.useState<BigNumber>(new BigNumber(0));

  React.useEffect(() => {
    const fetchUserUnstakeInfo = async () => {
      if (account) {
        const result: Array<{ amount: string }> = await bnJs.Staking.getUserUnstakeInfo(account);
        setUnstakingAmount(
          result
            .map(record => BalancedJs.utils.toIcx(new BigNumber(record['amount'], 16)))
            .reduce((sum, cur) => sum.plus(cur), new BigNumber(0)),
        );
      }
    };

    fetchUserUnstakeInfo();
  }, [account, transactions]);

  return (
    <>
      <Typography mb="3" variant="h3">
        <Trans>Unstaking</Trans>
      </Typography>

      {!unstakingAmount.isZero() ? (
        <>
          <Typography mb="1">
            <Trans>Your ICX will be unstaked as more ICX collateral is deposited into Balanced.</Trans>
          </Typography>

          <Typography variant="p">
            <Trans>{unstakingAmount.dp(2).toFormat()} ICX unstaking</Trans>
          </Typography>
        </>
      ) : (
        <Typography>
          <Trans>There's no ICX unstaking.</Trans>
        </Typography>
      )}

      {claimableICX.isGreaterThan(0) && (
        <Typography mt="1" fontSize={16} color="#fff">
          <Trans>{claimableICX.toFixed(2)} ICX is ready to claim</Trans>
        </Typography>
      )}

      {claimableICX.isGreaterThan(0) && (
        <Flex mt={5}>
          <Button onClick={toggleOpen}>
            <Trans>Claim ICX</Trans>
          </Button>
        </Flex>
      )}

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" mb="5px">
            <Trans>Claim ICX?</Trans>
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            <Trans>{`${claimableICX.toFixed(2)} ICX`}</Trans>
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">
                <Trans>Before</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {`${icxBalance.toFixed(2)} ICX`}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">
                <Trans>After</Trans>
              </Typography>
              <Typography variant="p" textAlign="center">
                {`${icxBalance.add(claimableICXCA).toFixed(2)} ICX`}
              </Typography>
            </Box>
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              <Trans>Not now</Trans>
            </TextButton>
            <Button onClick={handleUnstake} fontSize={14}>
              <Trans>Claim ICX</Trans>
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
}
