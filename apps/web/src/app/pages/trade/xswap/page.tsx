import React from 'react';

import { SectionPanel } from '@/app/components/Panel';
import SwapDescription from './_components/SwapDescription';
import SwapPanel from './_components/SwapPanel';
import TokenList from './_components/TokenList';
import PendingOrders from './_components/PendingOrders';

export function TradePage() {
  return (
    <>
      <SectionPanel bg="bg2">
        <SwapPanel />
        <SwapDescription />
      </SectionPanel>
      <PendingOrders />
      <TokenList />
    </>
  );
}
