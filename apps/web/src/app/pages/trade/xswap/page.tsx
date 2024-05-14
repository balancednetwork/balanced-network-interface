import React from 'react';

import SwapDescription from 'app/components/trade/SwapDescription';
import { SectionPanel } from 'app/components/trade/utils';
import { AllTransactionsUpdater } from '../bridge-v2/_zustand/useTransactionStore';
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
