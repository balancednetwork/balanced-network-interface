import { XChainId, XChainType } from '@balancednetwork/sdk-core';

import { xChainMap } from '@/constants/xChains';

export function getXChainType(xChainId: XChainId | undefined): XChainType | undefined {
  if (!xChainId) {
    return undefined;
  }
  return xChainMap[xChainId].xChainType;
}

export const getWagmiChainId = (xChainId: XChainId): number => {
  const xChainMap = {
    '0xa869.fuji': 43113,
    'sonic-blaze': 57054,
    sonic: 146,
    '0xa86a.avax': 43114,
    '0x38.bsc': 56,
    '0xa4b1.arbitrum': 42161,
    '0x2105.base': 8453,
    '0xa.optimism': 10,
    '0x89.polygon': 137,
  };
  return xChainMap[xChainId] ?? 0;
};
