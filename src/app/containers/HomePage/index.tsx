import React from 'react';

import Nouislider from 'nouislider-react';
import { Helmet } from 'react-helmet-async';
import { Box, Flex } from 'rebass/styled-components';
import styled from 'styled-components';

import { Button, TextButton } from 'app/components/Button';
import CurrencyLogo from 'app/components/CurrencyLogo';
import Divider from 'app/components/Divider';
import { Field } from 'app/components/Form';
import { DefaultLayout } from 'app/components/Layout';
import { BoxPanel, FlexPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'demo';

const Grid = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr;
  grid-gap: 50px;
  margin-bottom: 50px;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-template-columns: 1fr;
  `}
`;

const ActivityPanel = styled(FlexPanel)`
  padding: 0;
  grid-area: 2 / 1 / 2 / 3;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    grid-area: initial;
    flex-direction: column;
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
        <BoxPanel bg="bg3">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">Collateral</Typography>

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

          <Box marginY={6}>
            <Nouislider
              disabled={!isEditing}
              id="slider-collateral"
              start={[10000]}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [15000],
              }}
            />
          </Box>

          <Flex justifyContent="space-between">
            <Box width={[1, 1 / 2]} mr={4}>
              <Field
                editable={isEditing}
                isActive
                label="Deposited"
                tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                value={37533}
                unit="ICX"
              />
            </Box>

            <Box width={[1, 1 / 2]} ml={4}>
              <Field
                editable={isEditing}
                isActive={false}
                label="Available"
                tooltipText="The amount of ICX available to deposit from your wallet."
                value={34740}
                unit="ICX"
              />
            </Box>
          </Flex>
        </BoxPanel>

        <BoxPanel bg="bg3">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">Loan</Typography>

            <Box>
              {isEditing ? (
                <>
                  <TextButton onClick={handleCancel}>Cancel</TextButton>
                  <Button>Confirm</Button>
                </>
              ) : (
                <Button onClick={handleAdjust}>Borrow</Button>
              )}
            </Box>
          </Flex>

          <Box marginY={6}>
            <Nouislider
              disabled={!isEditing}
              id="slider-collateral"
              start={[10000]}
              padding={[0]}
              connect={[true, false]}
              range={{
                min: [0],
                max: [15000],
              }}
            />
          </Box>

          <Flex justifyContent="space-between">
            <Box width={[1, 1 / 2]} mr={4}>
              <Field
                editable={isEditing}
                isActive
                label="Borrowed"
                tooltipText="Your collateral balance. It earns interest from staking, but is also sold over time to repay your loan."
                value={37533}
                unit="ICD"
              />
            </Box>

            <Box width={[1, 1 / 2]} ml={4}>
              <Field
                editable={isEditing}
                isActive={false}
                label="Available"
                tooltipText="The amount of ICX available to deposit from your wallet."
                value={34740}
                unit="ICD"
              />
            </Box>
          </Flex>
        </BoxPanel>

        <ActivityPanel bg="bg2">
          <BoxPanel bg="bg3" maxWidth={[350, 'initial']}>
            <Typography variant="h2" mb={5}>
              Position detail
            </Typography>

            <Flex>
              <Box width={1 / 2} className="border-right">
                <Typography>Collateral</Typography>
                <Typography variant="p">$10,349</Typography>
              </Box>
              <Box width={1 / 2} sx={{ textAlign: 'right' }}>
                <Typography>Loan</Typography>
                <Typography variant="p">$1,512 / $2,587</Typography>
              </Box>
            </Flex>
            <Divider style={{ marginTop: 20, marginBottom: 20 }} />
            <Typography mb={2}>The current ICX price is $0.2400.</Typography>
            <Typography>You hold 0.15% of the total debt.</Typography>
          </BoxPanel>
          <BoxPanel bg="bg2"></BoxPanel>
        </ActivityPanel>
        <BoxPanel bg="bg2">
          <Typography variant="h2">Wallet</Typography>

          {/* <!-- wallet asset list --> */}
          <table className="list liquidity">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Balance</th>
                <th>Value</th>
              </tr>
            </thead>

            <tbody>
              {Object.values(CURRENCYLIST).map(item => (
                <tr key={item.name}>
                  <td>
                    <CurrencyLogo currency={item} style={{ marginRight: 8 }} />
                    {item.symbol}
                  </td>
                  <td>6,808</td>
                  <td>$1,634</td>
                </tr>
              ))}
            </tbody>
          </table>
        </BoxPanel>

        <BoxPanel bg="bg2">
          <Flex justifyContent="space-between" alignItems="center">
            <Typography variant="h2">Rewards</Typography>

            <Typography>Last claimed 2 days ago</Typography>
          </Flex>
        </BoxPanel>
      </Grid>
    </DefaultLayout>
  );
}
