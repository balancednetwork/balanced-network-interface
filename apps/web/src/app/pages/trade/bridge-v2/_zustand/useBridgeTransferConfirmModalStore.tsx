import { create } from 'zustand';

type BridgeTransferConfirmModalStore = {
  modalOpen: boolean;
};

export const useBridgeTransferConfirmModalStore = create<BridgeTransferConfirmModalStore>()(set => ({
  modalOpen: false,
}));

export const bridgeTransferConfirmModalActions = {
  openModal: () => {
    useBridgeTransferConfirmModalStore.setState({ modalOpen: true });
  },
  closeModal: () => {
    useBridgeTransferConfirmModalStore.setState({ modalOpen: false });
  },
};
