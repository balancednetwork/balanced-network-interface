import { SpokeChainId, spokeChainConfig, supportedSpokeChains, supportedTokensPerChain } from '@sodax/sdk';
import { balancedSupportedChains } from './balancedConfig';

const MANUAL_TOKEN_BLACKLIST = ['BALN'];

export function getTokens() {
  const chains = supportedSpokeChains.filter(chain => balancedSupportedChains.includes(chain));
  const tokens = Array.from(supportedTokensPerChain).map(([chain, tokens]) =>
    chains.includes(chain as SpokeChainId) ? tokens.map(token => token.symbol) : [],
  );

  return tokens
    .flat()
    .filter((token, index, self) => self.indexOf(token) === index)
    .filter(token => !MANUAL_TOKEN_BLACKLIST.includes(token));
}
export const SODAX_TOKEN_SYMBOLS = getTokens();
