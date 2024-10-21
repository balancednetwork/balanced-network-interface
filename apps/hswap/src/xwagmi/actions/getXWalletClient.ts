import { XChainId } from '@balancednetwork/sdk-core';
import { XWalletClient } from '../core/XWalletClient';
import { useXWagmiStore } from '../useXWagmiStore';

export function getXWalletClient(xChainId: XChainId): XWalletClient {
  return useXWagmiStore.getState().xWalletClients[xChainId]!;
}
