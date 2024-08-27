import { XChainId } from '@/types';
import { XWalletClient } from '../core/XWalletClient';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXWalletClient(xChainId: XChainId): XWalletClient | undefined {
  const xWalletClients = useXWagmiStore(state => state.xWalletClients);
  return xWalletClients[xChainId];
}
