import rlp from 'rlp';

import { COMBINED_TOKENS_LIST } from 'constants/tokens';
import { XCallState } from 'store/xCall/reducer';

import { ARCHWAY_SUPPORTED_TOKENS_LIST } from './archway/tokens';
import { OriginXCallData, SupportedXCallChains, XCallEvent, XCallEventType } from './types';

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
    case XCallEvent.CallMessageSent:
      return XCallEvent.CallMessage;
    default:
      return XCallEvent.CallMessage;
  }
};

export const getNetworkDisplayName = (chain: SupportedXCallChains) => {
  if (chain === 'icon') {
    return 'ICON';
  }
  if (chain === 'archway') {
    return 'Archway';
  }
  return '';
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

export const getCrossChainTokenAddress = (chain: SupportedXCallChains, tokenSymbol?: string): string | undefined => {
  if (!tokenSymbol) return;
  if (chain === 'icon') {
    return COMBINED_TOKENS_LIST.find(token => token.symbol === tokenSymbol)?.address;
  } else if (chain === 'archway') {
    return ARCHWAY_SUPPORTED_TOKENS_LIST.find(token => token.symbol === tokenSymbol)?.address;
  }
};

export const getCrossChainTokenBySymbol = (chain: SupportedXCallChains, symbol?: string) => {
  if (!symbol) return;
  if (chain === 'icon') {
    return COMBINED_TOKENS_LIST.find(token => token.symbol === symbol);
  } else if (chain === 'archway') {
    return ARCHWAY_SUPPORTED_TOKENS_LIST.find(token => token.symbol === symbol);
  }
};
