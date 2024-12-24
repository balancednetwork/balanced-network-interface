import { allXTokens } from '@balancednetwork/xwagmi';
import { XChainId } from '@balancednetwork/xwagmi';

const useXTokens = (from: XChainId) => {
  return allXTokens.filter(t => t.xChainId === from);
};

export default useXTokens;
