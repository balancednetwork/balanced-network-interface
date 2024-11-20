import { Currency, XChainId } from '@balancednetwork/sdk-core';

import { NATIVE_ADDRESS } from '@/xwagmi/constants';
import { xChainMap } from '@/xwagmi/constants/xChains';
import { allXTokens, xTokenMap } from '@/xwagmi/constants/xTokens';
import { XToken } from '@/xwagmi/types';

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

  let addr = xToken.address;
  // return different native address depends on the chain
  if (xToken.address === NATIVE_ADDRESS) {
    switch (xToken.xChainId) {
      case 'sui':
        addr = '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
        break;
      case 'solana':
        addr = '11111111111111111111111111111111';
        break;
      default:
        addr = '0x0000000000000000000000000000000000000000';
        break;
    }
  }

  return xToken.xChainId + '/' + addr;
};
