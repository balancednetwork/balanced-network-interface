import { SupportedChainId as ChainId } from '@balancednetwork/balanced-js';
import { Token } from '@balancednetwork/sdk-core';

import { NETWORK_ID } from 'constants/config';
import { TokenMap } from 'constants/tokens';
import { ARCHWAY_TRANSFORMED_DEFAULT_TOKEN_LIST } from 'store/lists/hooks';

// disable prettier printWidth rule
// prettier-ignore
export const StakedArchwayToken: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'cxfe94530ee0d159db3e5b7dcffbcd0dfb360075c0', 18, 'sARCH', 'Staked Archway'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, 'cx4761756e11195947dd27d765ac01e931b836065c', 18, 'sARCH', 'Staked Archway'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, 'cx1f94585b61e47db9d5e036307f96a3251a0486a1', 18, 'sARCH', 'Staked Archway'),
};

export const ArchwayToken: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'NativeArchFakeAddrress', 18, 'ARCH', 'Archway'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, 'NativeArchFakeAddrress', 18, 'ARCH', 'Archway'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, 'NativeArchFakeAddrress', 18, 'ARCH', 'Archway'),
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

export const useARCH = () => {
  return ArchwayToken[NETWORK_ID];
};

export const ARCHWAY_SUPPORTED_TOKENS_LIST: Token[] = Object.values(ARCHWAY_SUPPORTED_TOKENS_MAP_BY_ADDRESS);
