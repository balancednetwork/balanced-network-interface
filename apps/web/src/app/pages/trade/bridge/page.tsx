import React from 'react';

import BridgePanel from './_components/BridgePanel';
import { SectionPanel } from 'app/components/trade/utils';

export function BridgePage() {
  return (
    <SectionPanel bg="bg2">
      <BridgePanel />
    </SectionPanel>
  );
}
