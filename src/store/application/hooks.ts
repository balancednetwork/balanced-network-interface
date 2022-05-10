import { useCallback } from 'react';

import { useIconReact } from 'packages/icon-react';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, AppState } from '../index';
import {
  changeShouldLedgedSignMessage,
  changeCurrentLedgerAddressPage,
  ApplicationModal,
  setOpenModal,
  updateSlippageTolerance,
} from './reducer';

export function useBlockNumber(): number | undefined {
  const { networkId: chainId } = useIconReact();

  return useSelector((state: AppState) => state.application.blockNumber[chainId ?? -1]);
}

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

export function useBridgeWalletModalToggle(): () => void {
  return useToggleModal(ApplicationModal.BRIDGE_WALLET);
}

export function useTransferAssetsModalToggle(): () => void {
  return useToggleModal(ApplicationModal.TRANSFER_ASSETS);
}

export function useShouldLedgerSign(): AppState['application']['shouldLedgerSign'] {
  const shouldSignLedger = useSelector((state: AppState) => state.application.shouldLedgerSign);
  return shouldSignLedger;
}

export function useCurrentLedgerAddressPage(): AppState['application']['currentLedgerAddressPage'] {
  const currentLedgerAddressPage = useSelector((state: AppState) => state.application.currentLedgerAddressPage);
  return currentLedgerAddressPage;
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

export function useChangeCurrentLedgerAddressPage(): (currentLedgerAddressPage: number) => void {
  const dispatch = useDispatch();
  return useCallback(
    (currentLedgerAddressPage: number) => {
      dispatch(changeCurrentLedgerAddressPage({ currentLedgerAddressPage }));
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
