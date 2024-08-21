import { useCallback } from 'react';
import { XConnector } from '../core/XConnector';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXConnect() {
  const setXConnection = useXWagmiStore(state => state.setXConnection);

  const connect = useCallback(
    async (xConnector: XConnector) => {
      const xAccount = await xConnector.connect();
      if (xAccount) {
        setXConnection(xConnector.xChainType, {
          xAccount,
          xConnectorId: xConnector.id,
        });
      }
    },
    [setXConnection],
  );
  return connect;
}
