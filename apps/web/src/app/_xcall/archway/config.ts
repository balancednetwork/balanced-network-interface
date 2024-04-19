import { SupportedChainId } from '@balancednetwork/balanced-js';

import { NETWORK_ID } from 'constants/config';

const ARCHWAY_WEBSOCKET_URLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: 'wss://rpc.mainnet.archway.io:443/websocket',
  [SupportedChainId.BERLIN]: 'wss://rpc.constantine.archway.tech:443/websocket',
  [SupportedChainId.LISBON]: 'wss://rpc.constantine.archway.tech:443/websocket',
  [SupportedChainId.SEJONG]: 'wss://rpc.constantine.archway.tech:443/websocket',
  [SupportedChainId.YEOUIDO]: 'wss://rpc.constantine.archway.tech:443/websocket',
};

export const ARCHWAY_WEBSOCKET_URL: string = ARCHWAY_WEBSOCKET_URLS[NETWORK_ID];
