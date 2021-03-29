import React from 'react';

import { Tabs, TabPanels, TabPanel } from '@reach/tabs';
import Nouislider from 'nouislider-react';
import { Box, Flex } from 'rebass/styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import { Link } from 'app/components/Link';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import { CURRENCYLIST } from 'constants/currency';

import { StyledTabList, StyledTab, Grid } from './utils';

export default function BALNWallet() {
  return (
    <BoxPanel bg="bg3">
      <Tabs>
        <StyledTabList>
          <StyledTab>Stake</StyledTab>
          <StyledTab>Send</StyledTab>
          <StyledTab>Unstaking</StyledTab>
        </StyledTabList>
        <Divider mb={3} />
        <TabPanels>
          <TabPanel>
            <Typography variant="h3">Stake Balance Tokens</Typography>

            <Typography my={1}>Stake your Balance Tokens to earn dividends.</Typography>

            <Box my={3}>
              <Nouislider
                disabled
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

            <Flex my={1} alignItems="center" justifyContent="space-between">
              <Typography>0 / 724</Typography>
              <Typography>97% staked</Typography>
            </Flex>

            <Flex alignItems="center" justifyContent="center" mt={5}>
              <Button>Adjust</Button>
            </Flex>
          </TabPanel>

          <TabPanel>
            <Grid>
              <Flex alignItems="center" justifyContent="space-between">
                <Typography variant="h3">Send BALN</Typography>
                <Link href="#">Send max</Link>
              </Flex>

              <CurrencyInputPanel
                value="0"
                showMaxButton={false}
                currency={CURRENCYLIST['baln']}
                onUserInput={() => null}
                id="swap-currency-output"
              />

              <AddressInputPanel value="" onUserInput={() => null} />
            </Grid>

            <Flex alignItems="center" justifyContent="center" mt={5}>
              <Button>Send</Button>
            </Flex>
          </TabPanel>

          <TabPanel>
            <Grid>
              <Typography variant="h3">Unstaking</Typography>

              <Box>
                <Typography>Collateral unstaking</Typography>
                <Typography variant="p">9,716 ICX ~12 days remaining.</Typography>
              </Box>

              <Box>
                <Typography>Liquidity unstaking</Typography>
                <Typography variant="p">3,468 ICX ~5 days remaining.</Typography>
              </Box>
            </Grid>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </BoxPanel>
  );
}
