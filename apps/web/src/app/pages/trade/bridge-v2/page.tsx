import React from 'react';

import { SectionPanel } from 'app/components/trade/utils';

import BridgeTransferForm from '../bridge/_components/BridgeTransferForm';
// import { BridgeActivity } from './_components/BridgeActivity';
import { BridgeTransferConfirmModal } from './_components/BridgeTransferConfirmModal';
import { useTransactionsUpdater } from './_zustand/useTransactionStore';

export function BridgeV2Page() {
  useTransactionsUpdater();

  return (
    <SectionPanel bg="bg2">
      <BridgeTransferForm openModal={() => {}} />
      {/* <BridgeTransferConfirmModal /> */}
    </SectionPanel>
  );
}
