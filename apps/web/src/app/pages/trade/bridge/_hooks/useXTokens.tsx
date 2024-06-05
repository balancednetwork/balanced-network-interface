import { XChainId, XToken } from '../types';
import { xTokenMap } from '../_config/xTokens';

const useXTokens = (from: XChainId, to?: XChainId) => {
  if (to) {
    return xTokenMap[from].filter(x => xTokenMap[to].some(y => y.symbol === x.symbol));
  } else {
    return xTokenMap[from];
  }
};

export default useXTokens;
