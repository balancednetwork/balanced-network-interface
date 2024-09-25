import { XChainType } from '@balancednetwork/sdk-core';
import { XService } from '../core';
import { useXWagmiStore } from '../useXWagmiStore';

export function getXService(xChainType: XChainType): XService {
  return useXWagmiStore.getState().xServices[xChainType]!;
}
