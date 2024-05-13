import { create } from 'zustand';

type ModalStore = {
  modals: {};
};

export const useModalStore = create<ModalStore>()(() => ({
  modals: {},
}));

export const modalActions = {
  isModalOpen: id => {
    return !!useModalStore.getState().modals?.[id];
  },
  openModal: id => {
    useModalStore.setState(prevState => {
      return {
        ...prevState,
        modals: {
          ...prevState.modals,
          [id]: true,
        },
      };
    });
  },
  closeModal: id => {
    useModalStore.setState(prevState => {
      return {
        ...prevState,
        modals: {
          ...prevState.modals,
          [id]: false,
        },
      };
    });
  },
};

export const MODAL_IDS = {
  BRIDGE_TRANSFER_CONFIRM_MODAL: 'BRIDGE_TRANSFER_CONFIRM_MODAL',
  XCALL_SWAP_MODAL: 'XCALL_SWAP_MODAL',
};
