import { create } from 'zustand';

export const useBridgeTransferConfirmModalStore = create(set => ({
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
