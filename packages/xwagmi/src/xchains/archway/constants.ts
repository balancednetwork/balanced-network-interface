import { SupportedChainId as ChainId } from '@balancednetwork/balanced-js';

const ARCHWAY_FEE_TOKEN_SYMBOLS: { [key in ChainId]: string } = {
  [ChainId.MAINNET]: 'aarch',
  [ChainId.BERLIN]: 'aconst',
  [ChainId.LISBON]: 'aconst',
  [ChainId.SEJONG]: 'aconst',
  [ChainId.YEOUIDO]: 'aconst',
  [ChainId.HAVAH]: 'aconst',
};

export const ARCHWAY_FEE_TOKEN_SYMBOL = ARCHWAY_FEE_TOKEN_SYMBOLS[1];
