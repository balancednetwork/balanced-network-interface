import { XChainType } from '@/types';
import { XService } from '../core';
import { useXWagmiStore } from '../useXWagmiStore';

export function getXService(xChainType: XChainType): XService {
  return useXWagmiStore.getState().xServices[xChainType]!;
}
