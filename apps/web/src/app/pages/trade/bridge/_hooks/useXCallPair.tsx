import { BridgePair } from '../types';
import { XChainId } from '@/types';

import { BRIDGE_PAIRS, sortChains } from '../_config/xChains';

const useXCallPair = (from: XChainId, to: XChainId): BridgePair | undefined => {
  const chains = sortChains(from, to);
  return BRIDGE_PAIRS.find(pair => pair.chains[0] === chains[0] && pair.chains[1] === chains[1]);
};

export default useXCallPair;
