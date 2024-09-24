import { xTokenMap } from '@/xwagmi/constants/xTokens';
import { XChainId } from '@balancednetwork/sdk-core';

const useXTokens = (from: XChainId, to?: XChainId) => {
  if (to) {
    return xTokenMap[from].filter(x => xTokenMap[to].some(y => y.identifier === x.identifier));
  } else {
    return xTokenMap[from];
  }
};

export default useXTokens;
