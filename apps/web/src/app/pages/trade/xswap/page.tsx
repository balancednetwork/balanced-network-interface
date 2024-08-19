import React from 'react';

import { SectionPanel } from '@/app/pages/trade/supply/_components/utils';
import SwapPanel from './_components/SwapPanel';
import SwapDescription from './_components/SwapDescription';
import TokenList from './_components/TokenList';

export function TradePage() {
  return (
    <>
      <SectionPanel bg="bg2">
        <SwapPanel />
        <SwapDescription />
      </SectionPanel>
      <TokenList />
    </>
  );
}
