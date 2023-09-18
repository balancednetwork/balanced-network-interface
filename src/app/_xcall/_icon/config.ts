import { SupportedChainId } from '@balancednetwork/balanced-js';

import { NETWORK_ID } from 'constants/config';

const ICON_WEBSOCKET_URLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: 'wss://solidwallet.io/api/v3/icon_dex/block',
  [SupportedChainId.BERLIN]: 'wss://berlin.net.solidwallet.io/api/v3/icon_dex/block',
  [SupportedChainId.LISBON]: 'wss://berlin.net.solidwallet.io/api/v3/icon_dex/block',
  [SupportedChainId.SEJONG]: 'wss://berlin.net.solidwallet.io/api/v3/icon_dex/block',
  [SupportedChainId.YEOUIDO]: 'wss://berlin.net.solidwallet.io/api/v3/icon_dex/block',
};

const ICON_XCALL_NETWORK_IDs: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: '0x1.icon',
  [SupportedChainId.BERLIN]: '0x7.icon',
  [SupportedChainId.LISBON]: '0x2.icon',
  [SupportedChainId.SEJONG]: '0xb.icon',
  [SupportedChainId.YEOUIDO]: '0x3.icon',
};

export const ICON_XCALL_NETWORK_ID = ICON_XCALL_NETWORK_IDs[NETWORK_ID];
export const ICON_WEBSOCKET_URL = ICON_WEBSOCKET_URLS[NETWORK_ID];
