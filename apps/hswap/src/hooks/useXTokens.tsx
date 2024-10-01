import { allXTokens, xTokenMap } from '@/xwagmi/constants/xTokens';
import { XChainId } from '@balancednetwork/sdk-core';

const useXTokens = (from: XChainId) => {
  return allXTokens.filter(t => t.xChainId === from);
};

export default useXTokens;
