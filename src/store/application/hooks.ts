import { useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, AppState } from '../index';
import { changeShouldLedgedSignMessage, ApplicationModal, setOpenModal, updateSlippageTolerance } from './actions';

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

export function useShouldLedgerSign(): AppState['application']['shouldLedgerSign'] {
  const shouldSignLedger = useSelector((state: AppState) => state.application.shouldLedgerSign);
  return shouldSignLedger;
}

export function useChangeShouldLedgerSign(): (shouldLedgerSign: boolean) => void {
  const dispatch = useDispatch();
  return useCallback(
    (shouldLedgerSign: boolean) => {
      dispatch(changeShouldLedgedSignMessage({ shouldLedgerSign }));
    },
    [dispatch],
  );
}

export function useSwapSlippageTolerance() {
  return useSelector((state: AppState) => state.application.slippageTolerance);
}

export function useSetSlippageTolerance() {
  const dispatch = useDispatch();
  return useCallback(
    (slippageTolerance: number) => {
      dispatch(updateSlippageTolerance({ slippageTolerance }));
    },
    [dispatch],
  );
}
