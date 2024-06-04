import { create } from 'zustand';

export enum MODAL_ID {
  XTRANSFER_CONFIRM_MODAL = 'XTRANSFER_CONFIRM_MODAL',
  XSWAP_CONFIRM_MODAL = 'XSWAP_CONFIRM_MODAL',
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
