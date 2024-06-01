import { XChainId, XToken } from '../types';
import { xTokenMap } from '../_config/xTokens';

const useXTokens = (from: XChainId, to?: XChainId) => {
  if (to) {
    return xTokenMap[from]?.[to];
  } else {
    return (
      Object.values(xTokenMap[from] || {})
        .flat()
        // to remove duplicated items
        .reduce((a: XToken[], c: XToken) => {
          if (!a.some(v => v.address === c.address)) {
            a.push(c);
          }
          return a;
        }, [])
    );
  }
};

export default useXTokens;
