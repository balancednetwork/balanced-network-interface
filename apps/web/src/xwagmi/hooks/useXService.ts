import { XChainType } from '@/types';
import { XService } from '../core';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXService(xChainType: XChainType): XService {
  const xService = useXWagmiStore(state => state.xServices[xChainType]!);
  return xService;
}
