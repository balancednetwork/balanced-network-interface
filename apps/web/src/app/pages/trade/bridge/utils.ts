import rlp from 'rlp';

import { XChainId, XCallEventType, XChain, XToken } from './types';
import { xChainMap, xChains } from './_config/xChains';
import { xTokenMap } from './_config/xTokens';
import { Currency } from '@balancednetwork/sdk-core';
import { NATIVE_ADDRESS } from 'constants/index';

export function getBytesFromNumber(value) {
  const hexString = value.toString(16).padStart(2, '0');
  return Buffer.from(hexString.length % 2 === 1 ? '0' + hexString : hexString, 'hex');
}

export function getBytesFromAddress(address) {
  return Buffer.from(address.replace('cx', '01'), 'hex');
}

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

export const getCrossChainTokenAddress = (chain: XChainId, tokenSymbol?: string): string | undefined => {
  if (!tokenSymbol) return;

  return xTokenMap[chain].find(t => t.symbol === tokenSymbol)?.address;
};

export const getCrossChainTokenBySymbol = (chain: XChainId, symbol?: string) => {
  if (!symbol) return;

  return Object.values(xTokenMap[chain]).find(t => t.symbol === symbol);
};

export const isXToken = (token?: Currency) => {
  if (!token) return false;

  return Object.values(xTokenMap)
    .flat()
    .some(t => t.address === token.wrapped.address);
};

export const getAvailableXChains = (currency?: Currency | null): XChain[] | undefined => {
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
