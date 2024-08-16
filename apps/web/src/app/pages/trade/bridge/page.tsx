import React from 'react';

import { SectionPanel } from '@/app/components/Panel';
import { MODAL_ID, modalActions } from '@/lib/xcall/_zustand/useModalStore';
import BridgeActivity from './_components/BridgeActivity';
import BridgeTransferForm from './_components/BridgeTransferForm';
import XTransferModal from './_components/XTransferModal';

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
