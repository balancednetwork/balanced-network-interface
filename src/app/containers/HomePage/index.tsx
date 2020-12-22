import React from 'react';

import { Helmet } from 'react-helmet-async';
import { Text, Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import { Field } from 'app/components/Form';
import { DefaultLayout } from 'app/components/Layout';
import { Panel } from 'app/components/Panel';

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 50px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
  `}
`;

const ActivityPanel = styled(Panel)`
  grid-area: '3 / 1 / 3 / 3';
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: initial;
  `}
`;

export function HomePage() {
  const [isEditing, setEditing] = React.useState<boolean>(false);

  const handleAdjust = () => {
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
  };

  return (
    <DefaultLayout>
      <Helmet>
        <title>Home</title>
      </Helmet>

      <Grid>
        <Panel bg="bg3">
          <Flex justifyContent="space-between" alignItems="cener">
            <Text color="text" fontSize={25} fontWeight="bold">
              Collateral
            </Text>

            <Box>
              {isEditing ? (
                <>
                  <TextButton onClick={handleCancel}>Cancel</TextButton>
                  <Button>Confirm</Button>
                </>
              ) : (
                <Button onClick={handleAdjust}>Adjust</Button>
              )}
            </Box>
          </Flex>

          <Flex justifyContent="space-between">
            <Box width={[1, 1 / 2]} mr={18}>
              <Field
                editable={isEditing}
                isActive
                label="Deposited"
                tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                value={37533}
                unit="ICX"
              />
            </Box>

            <Box width={[1, 1 / 2]} ml={18}>
              <Field
                editable={isEditing}
                isActive={false}
                label="Wallet"
                tooltipText="The amount of ICX available to deposit from your wallet."
                value={34740}
                unit="ICX"
              />
            </Box>
          </Flex>
        </Panel>

        <Panel bg="bg3">
          <Text color="text" fontSize={25} fontWeight="bold">
            Loan
          </Text>
        </Panel>

        <Panel bg="bg2">
          <Text color="text" fontSize={25} fontWeight="bold">
            Wallet
          </Text>
        </Panel>

        <Panel bg="bg2">
          <Text color="text" fontSize={25} fontWeight="bold">
            Rewards
          </Text>
        </Panel>

        <ActivityPanel bg="bg2">
          <Text color="text" fontSize={25} fontWeight="bold">
            Activity
          </Text>
        </ActivityPanel>
      </Grid>
    </DefaultLayout>
  );
}
