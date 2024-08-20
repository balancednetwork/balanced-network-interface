import { XChainType } from '@/types';
import { useCallback } from 'react';
import { useDisconnect } from 'wagmi';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXDisconnect() {
  const xConnections = useXWagmiStore(state => state.xConnections);
  const unsetXConnection = useXWagmiStore(state => state.unsetXConnection);

  const { disconnectAsync } = useDisconnect();

  const disconnect = useCallback(
    async (xChainType: XChainType) => {
      if (xChainType === 'EVM') {
        await disconnectAsync();
      } else {
        const xConnector = xConnections[xChainType].xConnector;
        await xConnector.disconnect();
      }
      unsetXConnection(xChainType);
    },
    [xConnections, unsetXConnection, disconnectAsync],
  );
  return disconnect;
}
