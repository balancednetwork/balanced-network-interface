import React from 'react';

import { Tabs, TabPanels, TabPanel } from '@reach/tabs';
import BigNumber from 'bignumber.js';

import Divider from 'app/components/Divider';

import SendPanel from '../SendPanel';
import { StyledTabList, StyledTab } from '../utils';
import UnstakePanel from './UnstakePanel';

interface ICXWalletProps {
  currencyKey: string;
  claimableICX: BigNumber;
}

export default function ICXWallet({ claimableICX }: ICXWalletProps) {
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleTabsChange = index => {
    setTabIndex(index);
  };

  return (
    <>
      <Tabs index={tabIndex} onChange={handleTabsChange}>
        <StyledTabList>
          <StyledTab>Send</StyledTab>
          <StyledTab hasNotification={claimableICX.isGreaterThan(0)}>Unstaking</StyledTab>
        </StyledTabList>
        <Divider mb={3} />
        <TabPanels>
          <TabPanel>
            <SendPanel currencyKey="ICX" />
          </TabPanel>

          <TabPanel>
            <UnstakePanel claimableICX={claimableICX} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}
