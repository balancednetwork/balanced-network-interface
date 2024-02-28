import { SupportedChainId } from '@balancednetwork/balanced-js';

import { NETWORK_ID } from 'constants/config';

import { SupportedXCallChains } from './types';

export const SUPPORTED_XCALL_CHAINS_BY_ICON_NETWORK: { [key in SupportedChainId]: SupportedXCallChains[] } = {
  [SupportedChainId.MAINNET]: ['archway', 'icon'],
  [SupportedChainId.BERLIN]: ['archway', 'icon'],
  [SupportedChainId.LISBON]: ['archway', 'icon'],
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

export const DEFAULT_TOKEN_CHAIN: { [key in string]: SupportedXCallChains } = {
  bnUSD: 'icon',
  sARCH: 'archway',
};

export const SUPPORTED_XCALL_CHAINS = SUPPORTED_XCALL_CHAINS_BY_ICON_NETWORK[NETWORK_ID];
export const CROSS_TRANSFER_TOKENS = CROSS_TRANSFER_TOKENS_BY_ICON_NETWORK[NETWORK_ID];
export const ASSET_MANAGER_TOKENS = ASSET_MANAGER_TOKENS_BY_ICON_NETWORK[NETWORK_ID];
