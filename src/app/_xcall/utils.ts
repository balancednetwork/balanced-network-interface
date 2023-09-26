import rlp from 'rlp';

import { SupportedXCallChains, XCallEvent, XCallEventType } from './types';

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

//TODO: improve this nonsense
export const getOppositeChain = (chain: SupportedXCallChains): SupportedXCallChains => {
  if (chain === 'icon') {
    return 'archway';
  } else {
    return 'icon';
  }
};
