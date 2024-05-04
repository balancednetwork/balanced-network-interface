import React from 'react';

import { SectionPanel } from 'app/components/trade/utils';

import BridgeTransferForm from '../bridge/_components/BridgeTransferForm';
import { BridgeTransferConfirmModal } from './_components/BridgeTransferConfirmModal';
import BridgeActivity from './_components/BridgeActivity';

import { AllTransactionsUpdater } from './_zustand/useTransactionStore';
import { bridgeTransferConfirmModalActions } from './_zustand/useBridgeTransferConfirmModalStore';
import { useXCallServiceFactory } from './_zustand/useXCallServiceStore';

export function BridgeV2Page() {
  useXCallServiceFactory();

  return (
    <SectionPanel bg="bg2">
      <BridgeTransferForm openModal={bridgeTransferConfirmModalActions.openModal} />
      <BridgeActivity />
      <BridgeTransferConfirmModal />

      <AllTransactionsUpdater />
    </SectionPanel>
  );
}
