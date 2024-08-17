import { useCallback } from 'react';
import { XConnector } from '../core/XConnector';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXConnect() {
  const setXConnection = useXWagmiStore(state => state.setXConnection);

  const connect = useCallback(
    async (xConnector: XConnector) => {
      const account = await xConnector.connect();
      if (account) {
        setXConnection(xConnector.xChainType, {
          account,
          xConnector,
        });
      }
    },
    [setXConnection],
  );
  return connect;
}
