import { XService } from '../core';
import { XChainType } from '../types';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXService(xChainType: XChainType | undefined): XService | undefined {
  const xService = useXWagmiStore(state => (xChainType ? state.xServices[xChainType] : undefined));
  return xService;
}
