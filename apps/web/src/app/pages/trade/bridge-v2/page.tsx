import React from 'react';

import { SectionPanel } from 'app/components/trade/utils';

import BridgeTransferForm from '../bridge/_components/BridgeTransferForm';
import { BridgeTransferConfirmModal } from './_components/BridgeTransferConfirmModal';
import BridgeActivity from './_components/BridgeActivity';

import { AllTransactionsUpdater } from './_zustand/useTransactionStore';
import { bridgeTransferConfirmModalActions } from './_zustand/useBridgeTransferConfirmModalStore';
import { useCreateXCallService } from './_zustand/useXCallServiceStore';
import { useBridgeInfo } from 'store/bridge/hooks';

export function BridgeV2Page() {
  const { bridgeDirection } = useBridgeInfo();
  useCreateXCallService(bridgeDirection.from);
  useCreateXCallService(bridgeDirection.to);

  return (
    <SectionPanel bg="bg2">
      <BridgeTransferForm openModal={bridgeTransferConfirmModalActions.openModal} />
      <BridgeActivity />
      <BridgeTransferConfirmModal />

      <AllTransactionsUpdater />
    </SectionPanel>
  );
}
