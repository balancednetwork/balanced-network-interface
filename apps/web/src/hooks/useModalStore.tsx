import { create } from 'zustand';

export enum MODAL_ID {
  XTRANSFER_CONFIRM_MODAL = 'XTRANSFER_CONFIRM_MODAL',
  XSWAP_CONFIRM_MODAL = 'XSWAP_CONFIRM_MODAL',
  //
  ICON_WALLET_OPTIONS_MODAL = 'ICON_WALLET_OPTIONS_MODAL',
  EVM_WALLET_OPTIONS_MODAL = 'EVM_WALLET_OPTIONS_MODAL',
  INJECTIVE_WALLET_OPTIONS_MODAL = 'INJECTIVE_WALLET_OPTIONS_MODAL',
  HAVAH_WALLET_OPTIONS_MODAL = 'HAVAH_WALLET_OPTIONS_MODAL',
  COSMOS_WALLET_OPTIONS_MODAL = 'COSMOS_WALLET_OPTIONS_MODAL',
  //
  XCOLLATERAL_CONFIRM_MODAL = 'XCOLLATERAL_CONFIRM_MODAL',
  XLOAN_CONFIRM_MODAL = 'XLOAN_CONFIRM_MODAL',
}

type ModalStore = {
  modals: Partial<Record<MODAL_ID, boolean>>;
  isModalOpen: (id: MODAL_ID) => boolean;
  openModal: (id: MODAL_ID) => void;
  closeModal: (id: MODAL_ID) => void;
};

export const useModalStore = create<ModalStore>()(() => ({
  modals: {},

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
}));

export const modalActions = {
  openModal: (id: MODAL_ID) => {
    useModalStore.getState().openModal(id);
  },
  closeModal: (id: MODAL_ID) => {
    useModalStore.getState().closeModal(id);
  },
};

export function useModalOpen(id: MODAL_ID): boolean {
  return useModalStore(state => state.modals?.[id]);
}
