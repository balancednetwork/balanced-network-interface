import React from 'react';

import { SectionPanel } from '@/app/components/Panel';
import PendingOrders from './_components/PendingOrders';
import SwapDescription from './_components/SwapDescription';
import SwapPanel from './_components/SwapPanel';

export function TradePage() {
  return (
    <>
      <SectionPanel bg="bg2">
        <SwapPanel />
        <SwapDescription />
      </SectionPanel>
      <PendingOrders />
    </>
  );
}
