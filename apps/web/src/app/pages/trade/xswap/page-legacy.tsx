import React from 'react';

import { SectionPanel } from '@/app/components/Panel';
import SwapDescriptionLegacy from './_components/SwapDescriptionLegacy';
import SwapPanelLegacy from './_components/SwapPanelLegacy';
import TokenList from './_components/TokenList';

export function TradePageLegacy() {
  return (
    <>
      <SectionPanel bg="bg2">
        <SwapPanelLegacy />
        {/* <SwapDescriptionLegacy /> */}
      </SectionPanel>
      <TokenList />
    </>
  );
}
