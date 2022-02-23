import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
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
          pending: `Claiming ICX...`,
          summary: `Claimed ${claimableICX.toNumber()} ICX.`,
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
        Unstaking
      </Typography>

      {!unstakingAmount.isZero() ? (
        <>
          <Typography mb="1">Your ICX will be unstaked as more collateral is deposited into Balanced.</Typography>

          <Typography variant="p">{unstakingAmount.dp(2).toFormat()} ICX unstaking</Typography>
        </>
      ) : (
        <Typography>There's no ICX unstaking.</Typography>
      )}

      {claimableICX.isGreaterThan(0) && (
        <Typography mt="1" fontSize={16} color="#fff">
          {claimableICX.toFixed(2)} ICX is ready to claim
        </Typography>
      )}

      {claimableICX.isGreaterThan(0) && (
        <Flex mt={5}>
          <Button onClick={toggleOpen}>Claim ICX</Button>
        </Flex>
      )}

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <ModalContent noCurrencyBalanceErrorMessage>
          <Typography textAlign="center" mb="5px">
            Claim ICX?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {`${claimableICX.toFixed(2)} ICX`}
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {`${icxBalance.toFixed(2)} ICX`}
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {`${icxBalance.add(claimableICXCA).toFixed(2)} ICX`}
              </Typography>
            </Box>
          </Flex>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={toggleOpen} fontSize={14}>
              Not now
            </TextButton>
            <Button onClick={handleUnstake} fontSize={14}>
              Claim ICX
            </Button>
          </Flex>
        </ModalContent>
      </Modal>
    </>
  );
}
