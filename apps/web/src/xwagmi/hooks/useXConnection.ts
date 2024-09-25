import { XChainType } from '@balancednetwork/sdk-core';
import { XConnection } from '../types';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXConnection(xChainType: XChainType | undefined): XConnection | undefined {
  const xConnection = useXWagmiStore(state => (xChainType ? state.xConnections?.[xChainType] : undefined));

  return xConnection;
}
