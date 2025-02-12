import { SupportedChainId as ChainId } from '@balancednetwork/balanced-js';
import { Token } from '@balancednetwork/sdk-core';

import { sARCH } from '@/constants/tokens1';

import { BTCB, ICX, OMM, bnUSD, sICX, wICX } from './tokens';

export const MAX_HOPS = 4;

// used to construct intermediary pairs for trading
export const BASES_TO_CHECK_TRADES_AGAINST: { [chainId: number]: Token[] } = {
  [ChainId.MAINNET]: [sICX[ChainId.MAINNET], bnUSD[ChainId.MAINNET]],
  [ChainId.YEOUIDO]: [sICX[ChainId.YEOUIDO], bnUSD[ChainId.YEOUIDO]],
  [ChainId.SEJONG]: [sICX[ChainId.SEJONG], bnUSD[ChainId.SEJONG]],
  [ChainId.BERLIN]: [sICX[ChainId.BERLIN], bnUSD[ChainId.BERLIN], sARCH[ChainId.BERLIN]],
  [ChainId.LISBON]: [sICX[ChainId.LISBON], bnUSD[ChainId.LISBON]],
};

export const ADDITIONAL_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {
    [sICX[ChainId.MAINNET].address]: [OMM[ChainId.MAINNET], sARCH[ChainId.MAINNET]],
  },
  [ChainId.BERLIN]: {
    [sICX[ChainId.MAINNET].address]: [sARCH[ChainId.BERLIN]],
  },
};
/**
 * Some tokens can only be swapped via certain pairs, so we override the list of bases that are considered for these
 * tokens.
 */
export const CUSTOM_BASES: { [chainId: number]: { [tokenAddress: string]: Token[] } } = {
  [ChainId.MAINNET]: {},
};

type ChainTokenList = {
  readonly [chainId: number]: Token[];
};

// used to construct the list of all pairs we consider by default in the frontend
export const BASES_TO_TRACK_LIQUIDITY_FOR: ChainTokenList = {
  [ChainId.MAINNET]: [sICX[ChainId.MAINNET], bnUSD[ChainId.MAINNET], BTCB[ChainId.MAINNET]],
  [ChainId.YEOUIDO]: [sICX[ChainId.YEOUIDO], bnUSD[ChainId.YEOUIDO]],
  [ChainId.SEJONG]: [sICX[ChainId.SEJONG], bnUSD[ChainId.SEJONG]],
  [ChainId.BERLIN]: [sICX[ChainId.BERLIN], bnUSD[ChainId.BERLIN]],
  [ChainId.LISBON]: [sICX[ChainId.LISBON], bnUSD[ChainId.LISBON]],
};

export const PINNED_PAIRS: { readonly [chainId: number]: [Token, Token][] } = {
  [ChainId.MAINNET]: [
    [ICX[ChainId.MAINNET], sICX[ChainId.MAINNET]],
    [wICX[ChainId.MAINNET], sICX[ChainId.MAINNET]],
  ],
  [ChainId.YEOUIDO]: [[wICX[ChainId.YEOUIDO], sICX[ChainId.YEOUIDO]]],
  [ChainId.SEJONG]: [[wICX[ChainId.SEJONG], sICX[ChainId.SEJONG]]],
  [ChainId.BERLIN]: [[wICX[ChainId.BERLIN], sICX[ChainId.BERLIN]]],
  [ChainId.LISBON]: [[wICX[ChainId.LISBON], sICX[ChainId.LISBON]]],
};
