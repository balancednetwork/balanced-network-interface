import { SupportedChainId } from 'packages/BalancedJs';

import { Currency, Token } from 'types/balanced-sdk-core';

import {
  sICX, //
  bnUSD,
  IUSDC,
  USDS,
  sICX_YEOUIDO,
  bnUSD_YEOUIDO,
  IUSDC_YEOUIDO,
  USDS_YEOUIDO,
  sICX_SEJONG,
  bnUSD_SEJONG,
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
  [SupportedChainId.MAINNET]: {},
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
  [SupportedChainId.MAINNET]: [],
};
