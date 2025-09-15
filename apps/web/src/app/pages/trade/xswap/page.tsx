import React from 'react';

import { SectionPanel } from '@/app/components/Panel';
import SwapDescription from './_components/SwapDescription';
import SwapPanel from './_components/SwapPanel';
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
