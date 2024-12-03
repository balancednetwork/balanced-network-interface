import { allXTokens } from '@/xwagmi/constants/xTokens';
import { XChainId } from '@/xwagmi/types';

const useXTokens = (from: XChainId) => {
  return allXTokens.filter(t => t.xChainId === from);
};

export default useXTokens;
