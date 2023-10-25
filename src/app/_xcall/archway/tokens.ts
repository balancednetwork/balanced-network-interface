import { SupportedChainId as ChainId } from '@balancednetwork/balanced-js';
import { Token } from '@balancednetwork/sdk-core';

import { NETWORK_ID } from 'constants/config';
import { TokenMap } from 'constants/tokens';
import { ARCHWAY_TRANSFORMED_DEFAULT_TOKEN_LIST } from 'store/lists/hooks';

// disable prettier printWidth rule
// prettier-ignore
export const ArchwayToken: TokenMap = {
  //TODO: Archway mainnet info
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, '', 6, 'sARCH', 'Staked Archway'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, 'cx6975cdce422307b73b753b121877960e83b3bc35', 6, 'TwitterAsset', 'Test Archway'),
};

const chainId = NETWORK_ID;

export const ARCHWAY_SUPPORTED_TOKENS_MAP_BY_ADDRESS = Object.keys(
  ARCHWAY_TRANSFORMED_DEFAULT_TOKEN_LIST[chainId] ?? {},
).reduce<{
  [address: string]: Token;
}>((newMap, address) => {
  newMap[address] = ARCHWAY_TRANSFORMED_DEFAULT_TOKEN_LIST[chainId][address].token;
  return newMap;
}, {});
//TODO: Add native Arch token here
// ARCHWAY_SUPPORTED_TOKENS_MAP_BY_ADDRESS[NULL_CONTRACT_ADDRESS] = ICX[chainId];

export const ARCHWAY_SUPPORTED_TOKENS_LIST: Token[] = Object.values(ARCHWAY_SUPPORTED_TOKENS_MAP_BY_ADDRESS);
