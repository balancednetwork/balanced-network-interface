import { Currency } from '@balancednetwork/sdk-core';

import { xChainMap, xChains } from '@balancednetwork/xwagmi';
import { xTokenMap } from '@balancednetwork/xwagmi';
import { XChain, XChainId, XToken } from '@balancednetwork/xwagmi';

export const getNetworkDisplayName = (chain: XChainId) => {
  return xChainMap?.[chain]?.name || 'unknown';
};

export const getXTokenAddress = (chain: XChainId, tokenSymbol?: string): string | undefined => {
  if (!tokenSymbol) return;

  return xTokenMap[chain].find(t => t.symbol === tokenSymbol)?.address;
};

export const isXToken = (token?: Currency) => {
  if (!token) return false;

  return Object.values(xTokenMap)
    .flat()
    .some(t => t.address === token.wrapped.address || t.symbol === token.symbol);
};

export const getAvailableXChains = (currency?: Currency | XToken | null): XChain[] | undefined => {
  if (!currency) return;

  const allXTokens = Object.values(xTokenMap).flat();

  const xChainIds = allXTokens.filter(t => t.symbol === currency.symbol).map(t => t.xChainId);

  return xChains.filter(x => xChainIds.includes(x.xChainId));
};

export const getSpokeVersions = (symbol: string): string[] => {
  const allTokens = Object.values(xTokenMap).flat();
  const spokeVersions = allTokens.filter(t => t.spokeVersion);
  const symbolSpokeVersions = spokeVersions.filter(t => t.symbol === symbol);
  return symbolSpokeVersions.map(t => t.spokeVersion) as string[];
};
