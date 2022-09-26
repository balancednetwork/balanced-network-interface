import React from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { Tabs, TabPanels, TabPanel } from '@reach/tabs';

import Divider from 'app/components/Divider';

import SendPanel from '../SendPanel';
import { StyledTabList, StyledTab } from '../utils';
import UnstakePanel from './UnstakePanel';

export default function SICXWallet({ currency }: { currency: Currency }) {
  return (
    <>
      <Tabs>
        <StyledTabList>
          <StyledTab>
            <Trans>Send</Trans>
          </StyledTab>
          <StyledTab>
            <Trans>Unstake</Trans>
          </StyledTab>
        </StyledTabList>
        <Divider mb={3} />
        <TabPanels>
          <TabPanel>
            <SendPanel currency={currency} />
          </TabPanel>
          <TabPanel>
            <UnstakePanel />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}
