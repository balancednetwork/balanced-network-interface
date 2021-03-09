import React from 'react';

import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import Divider from 'app/components/Divider';
import Modal from 'app/components/Modal';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';

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

  const handleClose = () => {
    setOpen(false);
  };

  const handleClaim = () => {
    setOpen(true);
  };

  return (
    <BoxPanel bg="bg2">
      <Flex justifyContent="space-between" alignItems="center" mb={5}>
        <Typography variant="h2">Rewards</Typography>

        <Typography>Last claimed 2 days ago</Typography>
      </Flex>

      <RewardGrid>
        <Row>
          <Typography variant="p">Loan rewards</Typography>
          <Typography variant="p">8 BALN</Typography>
        </Row>

        <Row>
          <Typography variant="p">Weekly dividends</Typography>

          <Box>
            <Typography variant="p" textAlign="right">
              7 ICX
            </Typography>
            <Typography variant="p" textAlign="right">
              12 ICD
            </Typography>
          </Box>
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
        <Button onClick={handleClaim}>Claim rewards</Button>
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
