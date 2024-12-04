import { useCallback } from 'react';
import { XChainType } from '../types';
import { xServices } from '../useXWagmiStore';
import { useXDisconnect } from './useXDisconnect';

export function useXDisconnectAll() {
  const xDisconnect = useXDisconnect();

  const disconnectAll = useCallback(async () => {
    // TODO: better handling for getting all xChainTypes
    const promises = Object.keys(xServices).map(xChainType => xDisconnect(xChainType as XChainType));
    await Promise.all(promises);
  }, [xDisconnect]);
  return disconnectAll;
}
