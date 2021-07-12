import React from 'react';

import BigNumber from 'bignumber.js';
import { BalancedJs } from 'packages/BalancedJs';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import { Button, TextButton } from 'app/components/Button';
import LedgerConfirmMessage from 'app/components/LedgerConfirmMessage';
import Modal from 'app/components/Modal';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { ZERO } from 'constants/index';
import { useChangeShouldLedgerSign } from 'store/application/hooks';
import { useTransactionAdder } from 'store/transactions/hooks';
import { useWalletBalances } from 'store/wallet/hooks';

export default function UnstakePanel() {
  const [portion, setPortion] = React.useState(ZERO);

  const changeShouldLedgerSign = useChangeShouldLedgerSign();

  const sliderInstance = React.useRef<any>(null);

  const { account } = useIconReact();

  const wallet = useWalletBalances();

  // modal logic
  const [open, setOpen] = React.useState(false);

  const toggleOpen = () => {
    setOpen(!open);
  };

  const beforeAmount = wallet['sICX'];

  const differenceAmount = wallet['sICX'].times(portion);

  const afterAmount = beforeAmount.minus(differenceAmount);

  // const addTransaction = useTransactionAdder();

  const handleUnstake = () => {
    if (bnJs.contractSettings.ledgerSettings.actived) {
      changeShouldLedgerSign(true);
    }

    // bnJs
    //   .inject({ account })
    //   .sICX.unstake(BalancedJs.utils.toLoop(differenceAmount))
    //   .then(res => {
    //     if (res.result) {
    //       addTransaction(
    //         { hash: res.result },
    //         {
    //           pending: `Preparing to unstake sICX...`,
    //           summary: `Unstaking ${differenceAmount.dp(2).toFormat()} sICX. Check ICX in your wallet for details.`,
    //         },
    //       );
    //       toggleOpen();
    //       setPortion(ZERO);
    //       sliderInstance?.current?.noUiSlider.set(0);
    //     } else {
    //       console.error(res);
    //     }
    //   })
    //   .finally(() => {
    //     changeShouldLedgerSign(false);
    //   });
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
  }, [account]);

  return (
    <>
      <Typography mb="3" variant="h3">
        Unstaking
      </Typography>

      {!unstakingAmount.isZero() ? (
        <>
          <Typography>Your ICX will be unstaked as more collateral is deposited into Balanced.</Typography>

          <Typography variant="p">{unstakingAmount.dp(2).toFormat()} ICX unstaking</Typography>
        </>
      ) : (
        <Typography>There's no ICX unstaking.</Typography>
      )}

      <Typography mt="1" fontSize={16} color="#fff">
        2000 ICX is ready to claim
      </Typography>

      <Flex mt={5}>
        <Button onClick={toggleOpen}>Claim ICX</Button>
      </Flex>

      <Modal isOpen={open} onDismiss={toggleOpen}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px">
            Claim ICX?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center" fontSize={20}>
            {differenceAmount.dp(2).toFormat()} ICX
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                {beforeAmount.dp(2).toFormat()} ICX
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                {afterAmount.dp(2).toFormat()} ICX
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
          {/* ledger */}
          <LedgerConfirmMessage />
        </Flex>
      </Modal>
    </>
  );
}
