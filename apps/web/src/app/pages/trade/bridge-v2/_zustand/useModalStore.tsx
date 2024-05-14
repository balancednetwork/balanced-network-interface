import { create } from 'zustand';

export enum MODAL_ID {
  BRIDGE_TRANSFER_CONFIRM_MODAL = 'BRIDGE_TRANSFER_CONFIRM_MODAL',
  XCALL_SWAP_MODAL = 'XCALL_SWAP_MODAL',
}

type ModalStore = {
  modals: Partial<Record<MODAL_ID, boolean>>;
};

export const useModalStore = create<ModalStore>()(() => ({
  modals: {},
}));

export const modalActions = {
  isModalOpen: (id: MODAL_ID) => {
    return !!useModalStore.getState().modals?.[id];
  },
  openModal: (id: MODAL_ID) => {
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
  closeModal: (id: MODAL_ID) => {
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
