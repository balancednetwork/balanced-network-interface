import { MessagingProtocol, MessagingProtocolId, XChainId } from '../types';
import useXCallPair from './useXCallPair';

const MESSAGING_PROTOCOLS: { [key in MessagingProtocolId]: MessagingProtocol } = {
  [MessagingProtocolId.BTP]: {
    id: MessagingProtocolId.BTP,
    name: 'BTP',
    description: 'is the Icon interoperability protocol',
  },
  [MessagingProtocolId.IBC]: {
    id: MessagingProtocolId.IBC,
    name: 'IBC',
    description: 'is the Cosmos interoperability protocol',
  },
  [MessagingProtocolId.C_RELAY]: {
    id: MessagingProtocolId.C_RELAY,
    name: 'Centralised Relay',
    description: 'is the interoperability protocol based on centralized relay',
  },
};

/**
 * This hook returns the fundamental messaging protocol information of xCall from x chain to y chain.
 * @constructor
 * @param {XChainId} from - bridge from.
 * @param {XChainId} to - bridge to.
 */

export const useXCallProtocol = (from: XChainId, to: XChainId): MessagingProtocol | undefined => {
  const pair = useXCallPair(from, to);
  const id = pair?.protocol;
  if (id) return MESSAGING_PROTOCOLS[id];
};

export default useXCallProtocol;
