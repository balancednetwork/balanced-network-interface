import React from 'react';

import BridgeActivity from 'app/components/bridge/BridgeActivity';
import BridgePanel from 'app/components/bridge/BridgePanel';
import { SectionPanel } from 'app/components/trade/utils';

export function BridgePage() {
  return (
    <SectionPanel bg="bg2">
      <BridgePanel />
      <BridgeActivity />
    </SectionPanel>
  );
}
