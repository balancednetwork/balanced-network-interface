import rlp from 'rlp';

import { XChainId, XCallEventType, XChain } from './types';
import { xChainMap, xChains } from './_config/xChains';
import { xTokenMap } from './_config/xTokens';
import { Currency } from '@balancednetwork/sdk-core';

export function getRlpEncodedMsg(msg: string | any[]) {
  return Array.from(rlp.encode(msg));
}

export function getBytesFromString(str: string) {
  return Array.from(Buffer.from(str, 'utf8'));
}

export function getStringFromBytes(bytes: number[]) {
  const buffer = Buffer.from(bytes);
  return buffer.toString('utf8');
}

//TODO: improve this nonsense
export const getFollowingEvent = (event: XCallEventType): XCallEventType => {
  switch (event) {
    case XCallEventType.CallMessageSent:
      return XCallEventType.CallMessage;
    default:
      return XCallEventType.CallMessage;
  }
};

export const getNetworkDisplayName = (chain: XChainId) => {
  return xChainMap[chain].name;
};

export const getArchwayCounterToken = (symbol?: string) => {
  if (symbol) {
    return xTokenMap['archway-1']?.['0x1.icon']?.find(t => t.symbol === symbol);
  }
};

export const getCrossChainTokenAddress = (chain: XChainId, tokenSymbol?: string): string | undefined => {
  if (!tokenSymbol) return;

  return Object.values(xTokenMap[chain] || {})
    .flat()
    .find(t => t.symbol === tokenSymbol)?.address;
};

export const getCrossChainTokenBySymbol = (chain: XChainId, symbol?: string) => {
  if (!symbol) return;

  return Object.values(xTokenMap[chain] || {})
    .flat()
    .find(t => t.symbol === symbol);
};

export const isXToken = (token?: Currency) => {
  if (!token) return false;

  return Object.values(xTokenMap)
    .flatMap(t => Object.values(t).flat())
    .some(t => t.address === token.wrapped.address);
};

export const getAvailableXChains = (currency?: Currency | null): XChain[] | undefined => {
  if (!currency) return;

  const allXTokens = Object.values(xTokenMap)
    .map(x => Object.values(x))
    .flat(2);

  const xChainIds = allXTokens.filter(t => t.symbol === currency.symbol).map(t => t.xChainId);

  return xChains.filter(x => xChainIds.includes(x.xChainId));
};
