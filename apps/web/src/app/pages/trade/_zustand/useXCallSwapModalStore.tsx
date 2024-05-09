import { create } from 'zustand';

type XCallSwapModalStore = {
  modalOpen: boolean;
};

export const useXCallSwapModalStore = create<XCallSwapModalStore>()(() => ({
  modalOpen: false,
}));

export const xCallSwapModalActions = {
  openModal: () => {
    useXCallSwapModalStore.setState({ modalOpen: true });
  },
  closeModal: () => {
    useXCallSwapModalStore.setState({ modalOpen: false });
  },
};
