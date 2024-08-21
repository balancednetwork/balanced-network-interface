import { xChainMap } from '@/constants/xChains';
import { XChainId, XChainType } from '@/types';

export function getXChainType(xChainId: XChainId | undefined): XChainType | undefined {
  if (!xChainId) {
    return undefined;
  }
  return xChainMap[xChainId].xChainType;
}
