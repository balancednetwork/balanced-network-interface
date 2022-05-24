import { useCallback } from 'react';

import { useSelector } from 'react-redux';

import { AppState } from 'store';
import { useAppDispatch } from 'store/hooks';

import { resetAccount, setFromNetwork, setToNetwork } from './actions';

export function useFromNetwork(): AppState['bridge']['fromNetwork'] {
  return useSelector((state: AppState) => state.bridge.fromNetwork);
}
export function useToNetwork(): AppState['bridge']['toNetwork'] {
  return useSelector((state: AppState) => state.bridge.toNetwork);
}

export function useResetAccount(): () => void {
  const dispatch = useAppDispatch();
  return useCallback(() => {
    dispatch(resetAccount());
  }, [dispatch]);
}

export function useSelectNetworkSrc(): (network: any) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    network => {
      dispatch(setFromNetwork({ network }));
    },
    [dispatch],
  );
}

export function useSelectNetworkDst(): (network: any) => void {
  const dispatch = useAppDispatch();
  return useCallback(
    network => {
      dispatch(setToNetwork({ network }));
    },
    [dispatch],
  );
}
