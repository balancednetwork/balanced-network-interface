import { SupportedChainId } from '@balancednetwork/balanced-js';

import { NETWORK_ID } from 'constants/config';

import { XChainId } from './types';

export const SUPPORTED_XCALL_CHAINS_BY_ICON_NETWORK: { [key in SupportedChainId]: XChainId[] } = {
  [SupportedChainId.MAINNET]: ['archway-1', '0x1.icon'],
  [SupportedChainId.BERLIN]: ['archway-1', '0x1.icon'],
  [SupportedChainId.LISBON]: ['archway-1', '0x1.icon'],
  [SupportedChainId.SEJONG]: [],
  [SupportedChainId.YEOUIDO]: [],
};

const CROSS_TRANSFER_TOKENS_BY_ICON_NETWORK: { [key in SupportedChainId]: string[] } = {
  [SupportedChainId.MAINNET]: ['bnUSD'],
  [SupportedChainId.BERLIN]: ['bnUSD'],
  [SupportedChainId.LISBON]: ['bnUSD'],
  [SupportedChainId.SEJONG]: [],
  [SupportedChainId.YEOUIDO]: [],
};

const ASSET_MANAGER_TOKENS_BY_ICON_NETWORK: { [key in SupportedChainId]: string[] } = {
  [SupportedChainId.MAINNET]: ['sARCH', 'archUSDC'],
  [SupportedChainId.BERLIN]: ['sARCH'],
  [SupportedChainId.LISBON]: ['sARCH'],
  [SupportedChainId.SEJONG]: [],
  [SupportedChainId.YEOUIDO]: [],
};

export const DEFAULT_TOKEN_CHAIN: { [key in string]: XChainId } = {
  bnUSD: '0x1.icon',
  sARCH: 'archway-1',
};

export const SUPPORTED_XCALL_CHAINS = SUPPORTED_XCALL_CHAINS_BY_ICON_NETWORK[NETWORK_ID];
export const CROSS_TRANSFER_TOKENS = CROSS_TRANSFER_TOKENS_BY_ICON_NETWORK[NETWORK_ID];
export const ASSET_MANAGER_TOKENS = ASSET_MANAGER_TOKENS_BY_ICON_NETWORK[NETWORK_ID];
