import { SupportedChainId } from '@balancednetwork/balanced-js';

import { NETWORK_ID } from 'constants/config';

const ARCHWAY_FEE_TOKEN_SYMBOLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: 'aarch',
  [SupportedChainId.BERLIN]: 'aconst',
  [SupportedChainId.LISBON]: 'aconst',
  [SupportedChainId.SEJONG]: 'aconst',
  [SupportedChainId.YEOUIDO]: 'aconst',
  [SupportedChainId.HAVAH]: 'aconst',
};

export const ARCHWAY_FEE_TOKEN_SYMBOL = ARCHWAY_FEE_TOKEN_SYMBOLS[NETWORK_ID];
