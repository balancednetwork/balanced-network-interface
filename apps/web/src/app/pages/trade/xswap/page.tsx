import React from 'react';

import SwapDescription from 'app/components/trade/SwapDescription';
import { SectionPanel } from 'app/pages/trade/supply/_components/utils';
import { AllTransactionsUpdater } from '../bridge/_zustand/useTransactionStore';
import SwapPanel from './_components/SwapPanel';

export function TradePage() {
  return (
    <SectionPanel bg="bg2">
      <SwapPanel />
      <SwapDescription />

      <AllTransactionsUpdater />
    </SectionPanel>
  );
}
