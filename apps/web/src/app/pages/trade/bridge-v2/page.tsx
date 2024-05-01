import React from 'react';

import { SectionPanel } from 'app/components/trade/utils';

import BridgeTransferForm from '../bridge/_components/BridgeTransferForm';
import { BridgeTransferConfirmModal } from './_components/BridgeTransferConfirmModal';
// import { BridgeActivity } from './_components/BridgeActivity';

import { useTransactionsUpdater } from './_zustand/useTransactionStore';
import { bridgeTransferConfirmModalActions } from './_zustand/useBridgeTransferConfirmModalStore';
import { useXCallEventScanner } from './_zustand/useXCallEventStore';

export function BridgeV2Page() {
  useTransactionsUpdater();
  useXCallEventScanner('archway-1');
  useXCallEventScanner('0x1.icon');

  return (
    <SectionPanel bg="bg2">
      <BridgeTransferForm openModal={bridgeTransferConfirmModalActions.openModal} />
      <BridgeTransferConfirmModal />
    </SectionPanel>
  );
}
