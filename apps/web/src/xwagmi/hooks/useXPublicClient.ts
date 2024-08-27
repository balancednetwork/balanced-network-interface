import { XPublicClient } from '../core/XPublicClient';
import { XChainId } from '../types';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXPublicClient(xChainId: XChainId): XPublicClient | undefined {
  const xPublicClients = useXWagmiStore(state => state.xPublicClients);
  return xPublicClients[xChainId];
}
