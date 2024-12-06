import { XChainId } from '@/types';
import { XWalletClient } from '../core/XWalletClient';
import { useXWagmiStore } from '../useXWagmiStore';

export function getXWalletClient(xChainId: XChainId): XWalletClient {
  return useXWagmiStore.getState().xWalletClients[xChainId]!;
}
