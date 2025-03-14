import { XChainId } from '@balancednetwork/sdk-core';
import { XWalletClient } from '../core/XWalletClient';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXWalletClient(xChainId: XChainId | undefined): XWalletClient | undefined {
  const xWalletClients = useXWagmiStore(state => state.xWalletClients);
  return xChainId ? xWalletClients[xChainId] : undefined;
}
