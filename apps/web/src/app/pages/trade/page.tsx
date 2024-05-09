import React from 'react';

import SwapDescription from 'app/components/trade/SwapDescription';
import SwapPanel from './_components/SwapPanel';
import { SectionPanel } from 'app/components/trade/utils';

export function TradePage() {
  return (
    <SectionPanel bg="bg2">
      <SwapPanel />
      <SwapDescription />
    </SectionPanel>
  );
}
