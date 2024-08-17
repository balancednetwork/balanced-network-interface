import { XChainType } from '@/types';
import { useCallback } from 'react';
import { XConnector } from '../core/XConnector';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXDisconnect() {
  const xConnections = useXWagmiStore(state => state.xConnections);
  const unsetXConnection = useXWagmiStore(state => state.unsetXConnection);

  const disconnect = useCallback(
    async (xChainType: XChainType) => {
      const xConnector = xConnections[xChainType].xConnector;
      await xConnector.disconnect();
      unsetXConnection(xChainType);
    },
    [xConnections, unsetXConnection],
  );
  return disconnect;
}
