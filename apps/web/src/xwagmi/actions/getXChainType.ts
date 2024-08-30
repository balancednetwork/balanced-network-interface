import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChainId, XChainType } from '@/xwagmi/types';

export function getXChainType(xChainId: XChainId | undefined): XChainType | undefined {
  if (!xChainId) {
    return undefined;
  }
  return xChainMap[xChainId].xChainType;
}
