import { Currency, XChainId, XToken } from '@balancednetwork/sdk-core';

import { isNativeCurrency } from '@/constants/tokens';
import { xChainMap, xChains } from '@/xwagmi/constants/xChains';
import { allXTokens, xTokenMap } from '@/xwagmi/constants/xTokens';
import { XChain } from '@/xwagmi/types';

export const getNetworkDisplayName = (chain: XChainId) => {
  return xChainMap[chain].name;
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

export const getXAddress = (xToken: XToken | undefined) => {
  if (!xToken) return undefined;

  return (
    xToken.xChainId + '/' + (isNativeCurrency(xToken) ? '0x0000000000000000000000000000000000000000' : xToken.address)
  );
};
