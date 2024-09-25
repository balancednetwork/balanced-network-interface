import { Currency, XChainId, XToken } from '@balancednetwork/sdk-core';

import { NATIVE_ADDRESS } from '@/xwagmi/constants';
import { xChainMap, xChains } from '@/xwagmi/constants/xChains';
import { allXTokens, xTokenMap } from '@/xwagmi/constants/xTokens';
import { XChain } from '@/xwagmi/types';

export const getNetworkDisplayName = (chain: XChainId) => {
  return xChainMap[chain].name;
};

export const getXTokenAddress = (chain: XChainId, tokenSymbol?: string): string | undefined => {
  if (!tokenSymbol) return;

  return allXTokens.find(t => t.symbol === tokenSymbol && t.xChainId === chain)?.address;
};

export const getXTokenBySymbol = (xChainId: XChainId, symbol?: string) => {
  if (!symbol) return;

  return allXTokens.find(t => t.xChainId === xChainId && t.symbol === symbol);
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
