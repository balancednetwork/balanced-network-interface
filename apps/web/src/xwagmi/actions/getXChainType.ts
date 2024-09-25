import { xChainMap } from '@/xwagmi/constants/xChains';
import { XChainId, XChainType } from '@balancednetwork/sdk-core';

export function getXChainType(xChainId: XChainId | undefined): XChainType | undefined {
  if (!xChainId) {
    return undefined;
  }
  return xChainMap[xChainId].xChainType;
}
