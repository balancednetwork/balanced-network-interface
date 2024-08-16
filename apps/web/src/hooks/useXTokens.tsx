import { xTokenMap } from '@/constants/xTokens';
import { XChainId } from '@/types';

const useXTokens = (from: XChainId, to?: XChainId) => {
  if (to) {
    return xTokenMap[from].filter(x => xTokenMap[to].some(y => y.identifier === x.identifier));
  } else {
    return xTokenMap[from];
  }
};

export default useXTokens;
