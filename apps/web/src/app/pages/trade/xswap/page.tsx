import React from 'react';

import SwapPanel from './_components/SwapPanel';
import SwapDescription from './_components/SwapDescription';
import { SectionPanel } from '@/app/components/Panel';

export function TradePage() {
  return (
    <SectionPanel bg="bg2">
      <SwapPanel />
      <SwapDescription />
    </SectionPanel>
  );
}
