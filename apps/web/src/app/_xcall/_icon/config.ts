import { SupportedChainId } from '@balancednetwork/balanced-js';

import { NETWORK_ID } from 'constants/config';

import { StakedArchwayToken } from '../archway/tokens';
import { XChainId } from '../types';
import { Token } from '@balancednetwork/sdk-core';

const ICON_WEBSOCKET_URLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: 'wss://ctz.solidwallet.io/api/v3/icon_dex/block',
  [SupportedChainId.BERLIN]: 'wss://berlin.net.solidwallet.io/api/v3/icon_dex/block',
  [SupportedChainId.LISBON]: 'wss://lisbon.net.solidwallet.io/api/v3/icon_dex/block',
  [SupportedChainId.SEJONG]: 'wss://sejong.net.solidwallet.io/api/v3/icon_dex/block',
  [SupportedChainId.YEOUIDO]: 'wss://yeouido.net.solidwallet.io/api/v3/icon_dex/block',
};

const ARCHWAY_FEE_TOKEN_SYMBOLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: 'aarch',
  [SupportedChainId.BERLIN]: 'aconst',
  [SupportedChainId.LISBON]: 'aconst',
  [SupportedChainId.SEJONG]: 'aconst',
  [SupportedChainId.YEOUIDO]: 'aconst',
};

type TokenChainsType = {
  [ICONtokenAddress: string]: [XChainId];
};

const CROSSCHAIN_SUPPORTED_TOKENS_: { [key in SupportedChainId]: any } = {
  [SupportedChainId.MAINNET]: {
    cx88fd7df7ddff82f7cc735c871dc519838cb235bb: ['0x1.icon', 'archway-1'],
    cxfe94530ee0d159db3e5b7dcffbcd0dfb360075c0: ['0x1.icon', 'archway-1'],
  },
  //TODO: refactor
  [SupportedChainId.BERLIN]: {
    cxd06f80e28e989a67e297799ab1fb501cdddc2b4d: ['0x1.icon', 'archway-1'],
    cx4761756e11195947dd27d765ac01e931b836065c: ['0x1.icon', 'archway-1'],
  },
  [SupportedChainId.LISBON]: {
    cx1f94585b61e47db9d5e036307f96a3251a0486a1: ['0x1.icon', 'archway-1'],
    cx87f7f8ceaa054d46ba7343a2ecd21208e12913c6: ['0x1.icon', 'archway-1'],
  },
  [SupportedChainId.YEOUIDO]: {},
  [SupportedChainId.SEJONG]: {},
};

const COSMOS_NATIVE_AVAILABLE_TOKENS_LIST: { [key in SupportedChainId]: Token[] } = {
  [SupportedChainId.MAINNET]: [StakedArchwayToken[SupportedChainId.MAINNET]],
  [SupportedChainId.BERLIN]: [StakedArchwayToken[SupportedChainId.BERLIN]],
  [SupportedChainId.LISBON]: [StakedArchwayToken[SupportedChainId.LISBON]],
  [SupportedChainId.YEOUIDO]: [],
  [SupportedChainId.SEJONG]: [],
};

const AUTO_EXECUTION_ON_ICON_: { [key in SupportedChainId]: boolean } = {
  [SupportedChainId.MAINNET]: true,
  [SupportedChainId.BERLIN]: true,
  [SupportedChainId.LISBON]: true,
  [SupportedChainId.YEOUIDO]: false,
  [SupportedChainId.SEJONG]: false,
};

export const ARCHWAY_FEE_TOKEN_SYMBOL = ARCHWAY_FEE_TOKEN_SYMBOLS[NETWORK_ID];
export const ICON_WEBSOCKET_URL = ICON_WEBSOCKET_URLS[NETWORK_ID];
export const CROSSCHAIN_SUPPORTED_TOKENS: TokenChainsType = CROSSCHAIN_SUPPORTED_TOKENS_[NETWORK_ID];
export const COSMOS_NATIVE_AVAILABLE_TOKENS = COSMOS_NATIVE_AVAILABLE_TOKENS_LIST[NETWORK_ID];
