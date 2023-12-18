import { useCallback } from 'react';

import { CHAIN_INFO } from '@balancednetwork/balanced-js';
import axios from 'axios';
import BigNumber from 'bignumber.js';
import { useIconReact } from 'packages/icon-react';
import { useQuery } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';

import { NETWORK_ID } from 'constants/config';

import { AppDispatch, AppState } from '../index';
import {
  changeShouldLedgedSignMessage,
  changeCurrentLedgerAddressPage,
  ApplicationModal,
  setOpenModal,
  updateSlippageTolerance,
  toggleICONWalletModal,
} from './reducer';

type BlockDetails = {
  timestamp: number;
  number: number;
};

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

export function useICONWalletModalToggle(): () => void {
  const isOpen = useSelector((state: AppState) => state.application.iconWalletModal);
  const dispatch = useDispatch<AppDispatch>();
  return useCallback(() => {
    console.log(isOpen);
    dispatch(toggleICONWalletModal({ isOpen: !isOpen }));
  }, [dispatch, isOpen]);
}

export function useIsICONWalletModalOpen(): boolean {
  return useSelector((state: AppState) => state.application.iconWalletModal);
}

export function useWalletModalToggle(): () => void {
  return useToggleModal(ApplicationModal.WALLET);
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

export const useBlockDetails = (timestamp: number) => {
  const getBlock = async (): Promise<BlockDetails> => {
    const { data } = await axios.get(`${CHAIN_INFO[NETWORK_ID].tracker}/api/v1/blocks/timestamp/${timestamp * 1000}`);
    return data;
  };
  return useQuery<BlockDetails>(`getBlock${timestamp}`, getBlock);
};

export function useICXUnstakingTime() {
  return useQuery(
    'icxUnstakingTime',
    async () => {
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
      try {
        const totalICXStakedResponse = await axios.post(CHAIN_INFO[1].APIEndpoint, totalStakedRequest);
        const totalICXResponse = await axios.post(CHAIN_INFO[1].APIEndpoint, totalICXRequest);
        const totalICXStaked = new BigNumber(totalICXStakedResponse.data.result.totalStake).div(10 ** 18).toNumber();
        const totalICX = new BigNumber(totalICXResponse.data.result).div(10 ** 18).toNumber();

        //70% is threshold when unstaking time is the same
        //20 is max unstaking time
        //5 is min unstaking time
        return new BigNumber(((20 - 5) / 0.7 ** 2) * (totalICXStaked / totalICX - 0.7) ** 2 + 5);
      } catch (e) {
        console.error('Error while fetching total ICX staked info', e);
      }
    },
    {
      keepPreviousData: true,
    },
  );
}
