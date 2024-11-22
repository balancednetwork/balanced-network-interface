import { Currency } from '@balancednetwork/sdk-core';

import { NATIVE_ADDRESS } from '@/xwagmi/constants';
import { xChainMap, xChains } from '@/xwagmi/constants/xChains';
import { xTokenMap } from '@/xwagmi/constants/xTokens';
import { XChain, XChainId, XToken } from '@/xwagmi/types';

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

  let addr = xToken.address;
  // return different native address depends on the chain
  if (xToken.address === NATIVE_ADDRESS) {
    switch (xToken.xChainId) {
      case 'sui':
        addr = '0000000000000000000000000000000000000000000000000000000000000002::sui::SUI';
        break;
      // !TODO: enable the code after the solana chain is added
      // case 'solana':
      //   addr = '11111111111111111111111111111111';
      //   break;
      default:
        addr = '0x0000000000000000000000000000000000000000';
        break;
    }
  }

  return xToken.xChainId + '/' + addr;
};

export const getSpokeVersions = (symbol: string): string[] => {
  const allTokens = Object.values(xTokenMap).flat();
  const spokeVersions = allTokens.filter(t => t.spokeVersion);
  const symbolSpokeVersions = spokeVersions.filter(t => t.symbol === symbol);
  return symbolSpokeVersions.map(t => t.spokeVersion) as string[];
};
