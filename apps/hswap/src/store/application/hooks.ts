import { useCallback } from 'react';

import { useDispatch, useSelector } from 'react-redux';

import { useIconNetworkId } from '@/hooks/useIconNetworkId';
import { AppState } from '../index';
import { updateSlippageTolerance } from './reducer';

export function useBlockNumber(): number | undefined {
  const chainId = useIconNetworkId();

  return useSelector((state: AppState) => state.application.blockNumber[chainId ?? -1]);
}

//////////////////chain wallet ///////////////////////////////////

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
