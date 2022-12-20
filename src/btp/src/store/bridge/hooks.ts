import { useCallback } from 'react';

import { BTPAppState, useBTPDispatch, useBTPSelector } from '..';
import { setNextFromNetwork, setFromNetwork, setToNetwork } from './bridge';

export function useFromNetwork(): BTPAppState['bridge']['fromNetwork'] {
  return useBTPSelector((state: BTPAppState) => state.bridge.fromNetwork);
}
export function useNextFromNetwork(): BTPAppState['bridge']['nextFromNetwork'] {
  return useBTPSelector((state: BTPAppState) => state.bridge.nextFromNetwork);
}
export function useToNetwork(): BTPAppState['bridge']['toNetwork'] {
  return useBTPSelector((state: BTPAppState) => state.bridge.toNetwork);
}

export function useSelectNextNetworkSrc(): (network: any) => void {
  const dispatch = useBTPDispatch();
  return useCallback(
    network => {
      dispatch(setNextFromNetwork(network));
    },
    [dispatch],
  );
}

export function useSelectNetworkSrc(): (network: any) => void {
  const dispatch = useBTPDispatch();
  return useCallback(
    network => {
      dispatch(setFromNetwork(network));
    },
    [dispatch],
  );
}

export function useSelectNetworkDst(): (network: any) => void {
  const dispatch = useBTPDispatch();
  return useCallback(
    network => {
      dispatch(setToNetwork(network));
    },
    [dispatch],
  );
}
