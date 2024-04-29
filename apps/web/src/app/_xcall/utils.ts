import rlp from 'rlp';

import { XCallState } from 'store/xCall/reducer';

import { OriginXCallData, XChainId, XCallEventType } from './types';
import { xChainMap } from './archway/config1';
import { xTokenMap } from './config';
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

export const getOriginEvent = (sn: number, xCallState: XCallState): OriginXCallData | undefined => {
  return Object.keys(xCallState.events)
    .map(chain => xCallState.events[chain].origin.find(e => e.sn === sn))
    .find(event => event);
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
