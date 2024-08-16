import { Currency } from '@balancednetwork/sdk-core';

import { NATIVE_ADDRESS } from '@/constants/index';
import { xChainMap, xChains } from '@/constants/xChains';
import { xTokenMap } from '@/constants/xTokens';
import { XChain, XChainId, XToken } from '@/types';

export const getNetworkDisplayName = (chain: XChainId) => {
  return xChainMap[chain].name;
};

export const getXTokenAddress = (chain: XChainId, tokenSymbol?: string): string | undefined => {
  if (!tokenSymbol) return;

  return xTokenMap[chain].find(t => t.symbol === tokenSymbol)?.address;
};

export const getXTokenBySymbol = (xChainId: XChainId, symbol?: string) => {
  if (!symbol) return;

  return Object.values(xTokenMap[xChainId]).find(t => t.symbol === symbol);
};

export const isXToken = (token?: Currency) => {
  if (!token) return false;

  return Object.values(xTokenMap)
    .flat()
    .some(t => t.address === token.wrapped.address);
};

export const getAvailableXChains = (currency?: Currency | XToken | null): XChain[] | undefined => {
  if (!currency) return;

  const allXTokens = Object.values(xTokenMap).flat();

  const xChainIds = allXTokens.filter(t => t.symbol === currency.symbol).map(t => t.xChainId);

  return xChains.filter(x => xChainIds.includes(x.xChainId));
};

export const getXAddress = (xToken: XToken | undefined) => {
  if (!xToken) return undefined;

  return (
    xToken.xChainId +
    '/' +
    (xToken.address === NATIVE_ADDRESS ? '0x0000000000000000000000000000000000000000' : xToken.address)
  );
};
