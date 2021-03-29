import React, { useState, useCallback } from 'react';

import { Tabs, TabPanels, TabPanel } from '@reach/tabs';
import { useIconReact } from 'packages/icon-react';
import { Box, Flex } from 'rebass/styled-components';

import AddressInputPanel from 'app/components/AddressInputPanel';
import { Button } from 'app/components/Button';
import CurrencyInputPanel from 'app/components/CurrencyInputPanel';
import Divider from 'app/components/Divider';
import { Link } from 'app/components/Link';
import { BoxPanel } from 'app/components/Panel';
import { Typography } from 'app/theme';
import bnJs from 'bnJs';
import { CURRENCYLIST } from 'constants/currency';

import { StyledTabList, StyledTab, Grid } from './utils';

export default function ICXWallet() {
  const [icxValueToSend, setICXValueToChange] = useState('0');
  const [addressToTransfer, setAddressToTransfer] = useState('');
  const { account } = useIconReact();

  const sendICX = useCallback(() => {
    if (!account) return;
    bnJs
      .transfer({
        value: Number(icxValueToSend),
        to: addressToTransfer,
      })
      .then(() => {
        setICXValueToChange('0');
        setAddressToTransfer('');
      });
  }, [setICXValueToChange, setAddressToTransfer, icxValueToSend, addressToTransfer, account]);

  return (
    <BoxPanel bg="bg3">
      <Tabs>
        <StyledTabList>
          <StyledTab>Send</StyledTab>
          <StyledTab>Unstaking</StyledTab>
        </StyledTabList>
        <Divider mb={3} />
        <TabPanels>
          <TabPanel>
            <Grid>
              <Flex alignItems="center" justifyContent="space-between">
                <Typography variant="h3">Send ICX</Typography>
                <Link href="#">Send max</Link>
              </Flex>

              <CurrencyInputPanel
                value={icxValueToSend}
                showMaxButton={false}
                currency={CURRENCYLIST['icx']}
                onUserInput={setICXValueToChange}
                id="swap-currency-output"
              />

              <AddressInputPanel value={addressToTransfer} onUserInput={setAddressToTransfer} />
            </Grid>

            <Flex alignItems="center" justifyContent="center" mt={5}>
              <Button onClick={sendICX}>Send</Button>
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
