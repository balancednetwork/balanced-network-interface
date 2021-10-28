import React from 'react';

import { Tabs, TabPanels, TabPanel } from '@reach/tabs';

import Divider from 'app/components/Divider';

import SendPanel from '../SendPanel';
import { StyledTabList, StyledTab } from '../utils';
import UnstakePanel from './UnstakePanel';

export default function SICXWallet() {
  return (
    <>
      <Tabs>
        <StyledTabList>
          <StyledTab>Send</StyledTab>
          <StyledTab>Unstake</StyledTab>
        </StyledTabList>
        <Divider mb={3} />
        <TabPanels>
          <TabPanel>
            <SendPanel currencyKey="sICX" />
          </TabPanel>
          <TabPanel>
            <UnstakePanel />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}
