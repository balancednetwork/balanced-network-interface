import { allXTokens } from '@balancednetwork/xwagmi/constants/xTokens';
import { XChainId } from '@balancednetwork/xwagmi/types';

const useXTokens = (from: XChainId) => {
  return allXTokens.filter(t => t.xChainId === from);
};

export default useXTokens;
