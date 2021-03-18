import React from 'react';

import { IconBuilder, IconConverter } from 'icon-sdk-js';
import { useIconReact, REWARD_ADDRESS } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { useRatioValue } from 'store/ratio/hooks';
import { useWalletBalanceValue } from 'store/wallet/hooks';

const RewardGrid = styled.div`
  display: grid;
  grid-template-rows: auto;
  grid-gap: 20px;
`;

const Row = styled(Flex)`
  align-items: flex-start;
  justify-content: space-between;
`;

const RewardsPanel = () => {
  const [open, setOpen] = React.useState(false);

  const { account } = useIconReact();
  const walletBalance = useWalletBalanceValue();
  const ratio = useRatioValue();
  const rewardValue = walletBalance.BALNreward?.toNumber();

  const handleClaimReward = () => {
    if (!account) return;
    const callTransactionBuilder = new IconBuilder.CallTransactionBuilder();

    // const data1 = Buffer.from('{"method": "_deposit_and_borrow", "params": {"_sender": "', 'utf8').toString('hex');
    // const data2 = Buffer.from('", "_asset": "", "_amount": 0}}', 'utf8').toString('hex');
    // const params = { _data1: data1, _data2: data2 };

    const depositPayload = callTransactionBuilder
      .from(account)
      .to(REWARD_ADDRESS)
      .method('claimRewards')
      //.params(params)
      .nid(IconConverter.toBigNumber(3))
      .timestamp(new Date().getTime() * 1000)
      .stepLimit(IconConverter.toBigNumber(1000000))
      //.value(IconAmount.of(formattedAmounts[Field.LEFT], IconAmount.Unit.ICX).toLoop())
      .version(IconConverter.toBigNumber(3))
      .build();

    const parsed = {
      jsonrpc: '2.0',
      method: 'icx_sendTransaction',
      params: IconConverter.toRawTransaction(depositPayload),
      id: Date.now(),
    };

    window.dispatchEvent(
      new CustomEvent('ICONEX_RELAY_REQUEST', {
        detail: {
          type: 'REQUEST_JSON-RPC',
          payload: parsed,
        },
      }),
    );
  };

  const handleClose = () => {
    setOpen(false);
  };

  // const handleClaim = () => {
  //   setOpen(true);
  // };

  return (
    <BoxPanel bg="bg2">
      <Flex justifyContent="space-between" alignItems="center" mb={5}>
        <Typography variant="h2">Rewards</Typography>

        <Typography>Last claimed 2 days ago</Typography>
      </Flex>

      <RewardGrid>
        <Row>
          <Typography variant="p">Loan rewards</Typography>
          <Typography variant="p">
            {!account
              ? '-'
              : walletBalance.BALNreward?.toNumber() === 0 || walletBalance.BALNreward?.isNaN()
              ? '0 BALN'
              : walletBalance.BALNreward?.toFixed(2) + 'BALN'}
          </Typography>
        </Row>

        <Divider />

        <Row>
          <Typography variant="p" fontWeight="bold">
            Total
          </Typography>
          <Typography variant="p" fontWeight="bold">
            $24.47
          </Typography>
        </Row>
      </RewardGrid>

      <Flex alignItems="center" justifyContent="center" mt={3}>
        <Button onClick={handleClaimReward}>Claim rewards</Button>
      </Flex>

      <Modal isOpen={open} onDismiss={handleClose}>
        <Flex flexDirection="column" alignItems="stretch" m={5} width="100%">
          <Typography textAlign="center" mb="5px" as="h3" fontWeight="normal">
            Stake new Balance Tokens?
          </Typography>

          <Typography variant="p" fontWeight="bold" textAlign="center">
            8 BALN
          </Typography>

          <Flex my={5}>
            <Box width={1 / 2} className="border-right">
              <Typography textAlign="center">Before</Typography>
              <Typography variant="p" textAlign="center">
                50 BALN
              </Typography>
            </Box>

            <Box width={1 / 2}>
              <Typography textAlign="center">After</Typography>
              <Typography variant="p" textAlign="center">
                58 BALN
              </Typography>
            </Box>
          </Flex>

          <Typography textAlign="center">
            Stake your Balance Tokens to earn dividends.
            <br /> Unstaking takes 3 days.
          </Typography>

          <Flex justifyContent="center" mt={4} pt={4} className="border-top">
            <TextButton onClick={handleClose}>Not now</TextButton>
            <Button>Stake</Button>
          </Flex>
        </Flex>
      </Modal>
    </BoxPanel>
  );
};

export default RewardsPanel;
