import { XChainId } from '../types';
import { xTokenMap } from '../_config/xTokens';

const useXTokens = (from: XChainId, to?: XChainId) => {
  if (to) {
    return xTokenMap[from]?.[to];
  } else {
    return Object.values(xTokenMap[from] || {}).flat();
  }
};

export default useXTokens;
