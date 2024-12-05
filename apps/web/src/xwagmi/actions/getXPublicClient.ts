import { XChainId } from '@/xwagmi/types';
import { XPublicClient } from '../core/XPublicClient';
import { useXWagmiStore } from '../useXWagmiStore';

export function getXPublicClient(xChainId: XChainId): XPublicClient {
  return useXWagmiStore.getState().xPublicClients[xChainId]!;
}