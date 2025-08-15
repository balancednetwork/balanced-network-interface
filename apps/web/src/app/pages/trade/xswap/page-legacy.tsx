import React from 'react';

import { SectionPanel } from '@/app/components/Panel';
import SwapDescription from './_components/SwapDescription';
import SwapPanelLegacy from './_components/SwapPanelLegacy';
import TokenList from './_components/TokenList';

export function TradePageLegacy() {
  return (
    <>
      <SectionPanel bg="bg2">
        <SwapPanelLegacy />
        <SwapDescription />
      </SectionPanel>
      <TokenList />
    </>
  );
}
