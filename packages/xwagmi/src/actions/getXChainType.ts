import { XChainId, XChainType } from '@balancednetwork/sdk-core';

import { xChainMap } from '@/constants/xChains';

export function getXChainType(xChainId: XChainId | undefined): XChainType | undefined {
  if (!xChainId) {
    return undefined;
  }
  return xChainMap[xChainId].xChainType;
}
