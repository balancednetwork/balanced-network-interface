import React from 'react';

import { Currency } from '@balancednetwork/sdk-core';
import { Trans } from '@lingui/macro';
import { Tabs, TabPanels, TabPanel } from '@reach/tabs';
import BigNumber from 'bignumber.js';

import Divider from 'app/components/Divider';

import SendPanel from '../SendPanel';
import { StyledTabList, StyledTab } from '../utils';
import UnstakePanel from './UnstakePanel';

interface ICXWalletProps {
  currency: Currency;
  claimableICX: BigNumber;
}

export default function ICXWallet({ currency, claimableICX }: ICXWalletProps) {
  const [tabIndex, setTabIndex] = React.useState(0);

  const handleTabsChange = index => {
    setTabIndex(index);
  };

  return (
    <>
      <Tabs index={tabIndex} onChange={handleTabsChange}>
        <StyledTabList>
          <StyledTab>
            <Trans>Send</Trans>
          </StyledTab>
          <StyledTab hasNotification={claimableICX.isGreaterThan(0)}>
            <Trans>Unstaking</Trans>
          </StyledTab>
        </StyledTabList>
        <Divider mb={3} />
        <TabPanels>
          <TabPanel>
            <SendPanel currency={currency} />
          </TabPanel>

          <TabPanel>
            <UnstakePanel claimableICX={claimableICX} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </>
  );
}
