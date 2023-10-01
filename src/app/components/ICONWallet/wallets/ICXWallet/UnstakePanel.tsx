import React from 'react';

import { t, Trans } from '@lingui/macro';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import Modal from 'app/components/Modal';
import ModalContent from 'app/components/ModalContent';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { SUPPORTED_TOKENS_MAP_BY_ADDRESS } from 'constants/tokens';
import { useBlockNumber, useChangeShouldLedgerSign, useICXUnstakingTime } from 'store/application/hooks';
import { useAllTransactions, useTransactionAdder } from 'store/transactions/hooks';
import { useICONWalletBalances } from 'store/wallet/hooks';
import { toCurrencyAmount } from 'utils';

interface UnstakePanelProps {
  claimableICX: BigNumber;
}

export default function UnstakePanel({ claimableICX }: UnstakePanelProps) {
  const changeShouldLedgerSign = useChangeShouldLedgerSign();
  const balances = useICONWalletBalances();

  const icxContractAddress = bnJs.ICX.address;
  const ICX = SUPPORTED_TOKENS_MAP_BY_ADDRESS[icxContractAddress];
  const icxBalance = balances[icxContractAddress];

  const claimableICXCA = toCurrencyAmount(ICX.wrapped, claimableICX);
  const { data: icxUnstakingTime } = useICXUnstakingTime();

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
          summary: t`Claimed ${claimableICX.dp(2).toNumber()} ICX.`,
        },
      );
    } catch (ex) {}

    changeShouldLedgerSign(false);
  };

  const [unstakes, setUnstakes] = React.useState<{ amount: BigNumber; unstakesOn: Date }[]>([]);
  const currentBlockHeight = useBlockNumber();

  React.useEffect(() => {
    const fetchUserUnstakeInfo = async () => {
      if (account && currentBlockHeight) {
        const result: Array<{ amount: string; blockHeight: string }> = await bnJs.Staking.getUserUnstakeInfo(account);
        setUnstakes(
          result.map(record => ({
            amount: new BigNumber(record.amount).div(10 ** 18),
            unstakesOn: new Date(
              new Date().getTime() + (parseInt(record.blockHeight, 16) - currentBlockHeight) * 2 * 1000,
            ),
          })),
        );
      }
    };

    fetchUserUnstakeInfo();
  }, [account, transactions, currentBlockHeight]);

  return (
    <>
      <Typography mb="3" variant="h3">
        <Trans>Unstaking</Trans>
      </Typography>

      {unstakes.map((unstake, index) => {
        return (
          <>
            {index === 0 && (
              <Typography mb="4">
                {t`The ICX unstaking period is ${
                  icxUnstakingTime ? icxUnstakingTime.toFixed(1) : '~7'
                } days, but yours may be ready to claim sooner based on the volume of ICX
                  converted to sICX.`}
              </Typography>
            )}
            <Flex alignItems="end" marginBottom="5px">
              <Typography variant="p" marginRight="5px">
                {unstake.amount.dp(2).toFormat()} ICX
              </Typography>
              <Typography>{t`unstakes within ${dayjs().to(unstake.unstakesOn, true)}`}</Typography>
            </Flex>
          </>
        );
      })}

      {unstakes.length === 0 && (
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
