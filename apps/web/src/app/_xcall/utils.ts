import rlp from 'rlp';

import { COMBINED_TOKENS_LIST } from 'constants/tokens';
import { XCallState } from 'store/xCall/reducer';

import { ARCHWAY_SUPPORTED_TOKENS_LIST } from './archway/tokens';
import { OriginXCallData, XChainId, XCallEventType } from './types';
import { xChainMap } from './archway/config1';

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
    return ARCHWAY_SUPPORTED_TOKENS_LIST.find(token => token.symbol === symbol);
  }
};

export const getOriginEvent = (sn: number, xCallState: XCallState): OriginXCallData | undefined => {
  return Object.keys(xCallState.events)
    .map(chain => xCallState.events[chain].origin.find(e => e.sn === sn))
    .find(event => event);
};

export const getCrossChainTokenAddress = (chain: XChainId, tokenSymbol?: string): string | undefined => {
  if (!tokenSymbol) return;
  if (chain === '0x1.icon') {
    return COMBINED_TOKENS_LIST.find(token => token.symbol === tokenSymbol)?.address;
  } else if (chain === 'archway-1') {
    return ARCHWAY_SUPPORTED_TOKENS_LIST.find(token => token.symbol === tokenSymbol)?.address;
  }
};

export const getCrossChainTokenBySymbol = (chain: XChainId, symbol?: string) => {
  if (!symbol) return;
  if (chain === '0x1.icon') {
    return COMBINED_TOKENS_LIST.find(token => token.symbol === symbol);
  } else if (chain === 'archway-1') {
    return ARCHWAY_SUPPORTED_TOKENS_LIST.find(token => token.symbol === symbol);
  }
};
