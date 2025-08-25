import { supportedSpokeChains } from '@sodax/sdk';
import { balancedSupportedChains } from './balancedConfig';

const getChains = () => {
  return supportedSpokeChains.filter(chain => balancedSupportedChains.includes(chain));
};

export const SODAX_CHAINS = getChains();
