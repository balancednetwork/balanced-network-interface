import React from 'react';

import { SectionPanel } from 'app/pages/trade/supply/_components/utils';

import BridgeTransferForm from './_components/BridgeTransferForm';
import { BridgeTransferConfirmModal } from './_components/BridgeTransferConfirmModal';
import BridgeActivity from './_components/BridgeActivity';

import { AllTransactionsUpdater } from './_zustand/useTransactionStore';
import { AllXCallMessagesUpdater } from './_zustand/useXCallMessageStore';
import { modalActions, MODAL_ID } from './_zustand/useModalStore';
import { useCreateXCallService } from './_zustand/useXCallServiceStore';
import { useBridgeDirection } from 'store/bridge/hooks';

export function BridgePage() {
  // TODO: review this
  const bridgeDirection = useBridgeDirection();
  useCreateXCallService(bridgeDirection.from);
  useCreateXCallService(bridgeDirection.to);

  return (
    <SectionPanel bg="bg2">
      <BridgeTransferForm
        openModal={() => {
          modalActions.openModal(MODAL_ID.BRIDGE_TRANSFER_CONFIRM_MODAL);
        }}
      />
      <BridgeActivity />
      <BridgeTransferConfirmModal />
      <AllTransactionsUpdater />
      <AllXCallMessagesUpdater />
    </SectionPanel>
  );
}
