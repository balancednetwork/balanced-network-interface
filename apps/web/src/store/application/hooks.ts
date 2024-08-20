import { useCallback } from 'react';

import { useIconReact } from '@/packages/icon-react';
import { CHAIN_INFO } from '@balancednetwork/balanced-js';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { useDispatch, useSelector } from 'react-redux';

import { AppDispatch, AppState } from '../index';
import {
  ApplicationModal,
  changeCurrentLedgerAddressPage,
  changeShouldLedgedSignMessage,
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

//////////////////chain wallet ///////////////////////////////////
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

export function useICXUnstakingTime() {
  return useQuery({
    queryKey: ['icxUnstakingTime'],
    queryFn: async () => {
      const totalICXRequest = {
        jsonrpc: '2.0',
        method: 'icx_getTotalSupply',
        id: 1234,
      };
      const totalStakedRequest = {
        jsonrpc: '2.0',
        id: 1234,
        method: 'icx_call',
        params: {
          to: 'cx0000000000000000000000000000000000000000',
          dataType: 'call',
          data: {
            method: 'getPReps',
          },
        },
      };
      const totalICXStakedResponse = await axios.post(CHAIN_INFO[1].APIEndpoint, totalStakedRequest);
      const totalICXResponse = await axios.post(CHAIN_INFO[1].APIEndpoint, totalICXRequest);
      const totalICXStaked = new BigNumber(totalICXStakedResponse.data.result.totalStake).div(10 ** 18).toNumber();
      const totalICX = new BigNumber(totalICXResponse.data.result).div(10 ** 18).toNumber();

      //70% is threshold when unstaking time is the same
      //20 is max unstaking time
      //5 is min unstaking time
      return new BigNumber(((20 - 5) / 0.7 ** 2) * (totalICXStaked / totalICX - 0.7) ** 2 + 5);
    },
    placeholderData: keepPreviousData,
  });
}
