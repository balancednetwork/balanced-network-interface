import { SupportedChainId as ChainId } from '@balancednetwork/balanced-js';
import { Token } from '@balancednetwork/sdk-core';

import { NETWORK_ID } from '@/constants/config';
import { TokenMap } from '@/constants/tokens';

// disable prettier printWidth rule
// prettier-ignore
export const sARCH: TokenMap = {
  [ChainId.MAINNET]: new Token(
    ChainId.MAINNET,
    'cxfe94530ee0d159db3e5b7dcffbcd0dfb360075c0',
    18,
    'sARCH',
    'Staked Archway',
  ),
  [ChainId.BERLIN]: new Token(
    ChainId.BERLIN,
    'cx4761756e11195947dd27d765ac01e931b836065c',
    18,
    'sARCH',
    'Staked Archway',
  ),
  [ChainId.LISBON]: new Token(
    ChainId.LISBON,
    'cx1f94585b61e47db9d5e036307f96a3251a0486a1',
    18,
    'sARCH',
    'Staked Archway',
  ),
};

export const ArchwayToken: TokenMap = {
  [ChainId.MAINNET]: new Token(ChainId.MAINNET, 'native', 18, 'ARCH', 'Archway'),
  [ChainId.BERLIN]: new Token(ChainId.BERLIN, 'native', 18, 'ARCH', 'Archway'),
  [ChainId.LISBON]: new Token(ChainId.LISBON, 'native', 18, 'ARCH', 'Archway'),
};

export const useARCH = () => {
  return ArchwayToken[NETWORK_ID];
};
