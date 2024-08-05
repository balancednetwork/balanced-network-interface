import React from 'react';

import { SectionPanel } from '@/app/pages/trade/supply/_components/utils';

import BridgeTransferForm from './_components/BridgeTransferForm';
import XTransferModal from './_components/XTransferModal';
import BridgeActivity from './_components/BridgeActivity';

import { modalActions, MODAL_ID } from './_zustand/useModalStore';

export function BridgePage() {
  return (
    <SectionPanel bg="bg2">
      <BridgeTransferForm
        openModal={() => {
          modalActions.openModal(MODAL_ID.XTRANSFER_CONFIRM_MODAL);
        }}
      />
      <BridgeActivity />
      <XTransferModal />
    </SectionPanel>
  );
}
