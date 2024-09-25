import { XChainType } from '@balancednetwork/sdk-core';
import { XService } from '../core';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXService(xChainType: XChainType | undefined): XService | undefined {
  const xService = useXWagmiStore(state => (xChainType ? state.xServices[xChainType] : undefined));
  return xService;
}
