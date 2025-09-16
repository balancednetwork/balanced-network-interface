import React from 'react';

import { SectionPanel } from '@/app/components/Panel';
import SwapPanelLegacy from './_components/SwapPanelLegacy';
import TokenList from './_components/TokenList';
import SwapDescriptionLegacy from './_components/SwapDescriptionLegacy';

export function TradePageLegacy() {
  return (
    <>
      <SectionPanel bg="bg2">
        <SwapPanelLegacy />
        <SwapDescriptionLegacy />
      </SectionPanel>
      <TokenList />
    </>
  );
}
