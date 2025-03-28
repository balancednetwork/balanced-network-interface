import { XChainId } from '@balancednetwork/sdk-core';
import { XPublicClient } from '../core/XPublicClient';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXPublicClient(xChainId: XChainId | undefined): XPublicClient | undefined {
  const xPublicClients = useXWagmiStore(state => state.xPublicClients);
  return xChainId ? xPublicClients[xChainId] : undefined;
}
