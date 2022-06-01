import { Currency, Token } from '@balancednetwork/sdk-core';
import { SupportedChainId } from 'packages/BalancedJs';

import {
  ICX,
  sICX, //
  bnUSD,
  IUSDC,
  USDS,
  ICX_YEOUIDO,
  sICX_YEOUIDO,
  bnUSD_YEOUIDO,
  IUSDC_YEOUIDO,
  USDS_YEOUIDO,
  ICX_SEJONG,
  sICX_SEJONG,
  bnUSD_SEJONG,
  IUSDT,
  OMM,
} from './tokens';

type ChainCurrencyList = {
  readonly [chainId: number]: Currency[];
};
/**
 * Shows up in the currency select for swap and add liquidity
 */
export const COMMON_BASES: ChainCurrencyList = {
  [SupportedChainId.MAINNET]: [
    sICX, //
    bnUSD,
    IUSDC,
    USDS,
  ],
  [SupportedChainId.YEOUIDO]: [
    sICX_YEOUIDO, //
    bnUSD_YEOUIDO,
    IUSDC_YEOUIDO,
    USDS_YEOUIDO,
  ],
};

export const MAX_HOPS = 4;

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: { [chainId: number]: Token[] } = {
  [SupportedChainId.MAINNET]: [sICX, bnUSD, IUSDC, USDS],
  [SupportedChainId.YEOUIDO]: [sICX_YEOUIDO, bnUSD_YEOUIDO, IUSDC_YEOUIDO, USDS_YEOUIDO],
  [SupportedChainId.SEJONG]: [sICX_SEJONG, bnUSD_SEJONG],
};
export const ADDITIONAL_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [SupportedChainId.MAINNET]: {
    [IUSDC.address]: [OMM, IUSDT],
    [sICX.address]: [OMM, IUSDT],
  },
};
/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [SupportedChainId.MAINNET]: {},
};

type ChainTokenList = {
  readonly [chainId: number]: Token[];
};

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  [SupportedChainId.MAINNET]: [sICX, bnUSD, IUSDC, USDS],
  [SupportedChainId.YEOUIDO]: [sICX_YEOUIDO, bnUSD_YEOUIDO, IUSDC_YEOUIDO, USDS_YEOUIDO],
  [SupportedChainId.SEJONG]: [sICX_SEJONG, bnUSD_SEJONG],
};
export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {
  [SupportedChainId.MAINNET]: [[ICX, sICX]],
  [SupportedChainId.YEOUIDO]: [[ICX_YEOUIDO, sICX_YEOUIDO]],
  [SupportedChainId.SEJONG]: [[ICX_SEJONG, sICX_SEJONG]],
};
