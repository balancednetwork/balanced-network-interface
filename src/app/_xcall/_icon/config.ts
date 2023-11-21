import { SupportedChainId } from '@balancednetwork/balanced-js';

import { NETWORK_ID } from 'constants/config';

import { SupportedXCallChains } from '../types';

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

type TokenChainsType = {
  [ICONtokenAddress: string]: [SupportedXCallChains];
};

const CROSSCHAIN_SUPPORTED_TOKENS_: { [key in SupportedChainId]: any } = {
  [SupportedChainId.MAINNET]: {
    cx88fd7df7ddff82f7cc735c871dc519838cb235bb: ['icon', 'archway'],
  },
  //TODO: refactor
  [SupportedChainId.BERLIN]: {
    cxd06f80e28e989a67e297799ab1fb501cdddc2b4d: ['icon', 'archway'],
    cx4761756e11195947dd27d765ac01e931b836065c: ['icon', 'archway'],
  },
  [SupportedChainId.LISBON]: {},
  [SupportedChainId.YEOUIDO]: {},
  [SupportedChainId.SEJONG]: {},
};

export const ICON_XCALL_NETWORK_ID = ICON_XCALL_NETWORK_IDs[NETWORK_ID];
export const ICON_WEBSOCKET_URL = ICON_WEBSOCKET_URLS[NETWORK_ID];
export const CROSSCHAIN_SUPPORTED_TOKENS: TokenChainsType = CROSSCHAIN_SUPPORTED_TOKENS_[NETWORK_ID];
