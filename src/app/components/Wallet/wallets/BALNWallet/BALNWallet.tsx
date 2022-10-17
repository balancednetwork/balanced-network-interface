import React from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { Tabs, TabPanels, TabPanel } from '@reach/tabs';

import Divider from 'app/components/Divider';

import SendPanel from '../SendPanel';
import { StyledTabList, StyledTab } from '../utils';
import StakePanel from './StakePanel';

export default function BALNWallet({ currency }: { currency: Currency }) {
  return (
    <>
      <Tabs>
        <StyledTabList>
          <StyledTab>
            <Trans>Stake</Trans>
          </StyledTab>
          <StyledTab>
            <Trans>Send</Trans>
          </StyledTab>
        </StyledTabList>
        <Divider mb={3} />
        <TabPanels>
          <TabPanel>
            <StakePanel />
          </TabPanel>

          <TabPanel>
            <SendPanel currency={currency} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}
