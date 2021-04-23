import { useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, AppState } from '../index';
import { ApplicationModal, changeWalletType, setOpenModal } from './actions';
import { WalletType } from './reducer';

export function useModalOpen(modal: ApplicationModal): boolean {
  const openModal = useSelector((state: AppState) => state.application.openModal);
  return openModal === modal;
}

export function useToggleModal(modal: ApplicationModal): () => void {
  const open = useModalOpen(modal);
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(() => dispatch(setOpenModal(open ? null : modal)), [dispatch, modal, open]);
}

export function useWalletModalToggle(): () => void {
  return useToggleModal(ApplicationModal.WALLET);
}

export function useWalletType(): AppState['application']['walletType'] {
  const walletType = useSelector((state: AppState) => state.application.walletType);
  return walletType;
}

export function useChangeWalletType(): (walletType: WalletType) => void {
  const dispatch = useDispatch();
  return useCallback(
    (walletType: WalletType) => {
      dispatch(changeWalletType({ walletType }));
    },
    [dispatch],
  );
}
