import { useMemo } from 'react';
import { XChainId } from '@/types';

/**
 * This hook returns the xcall message path from x chain to y chain.
 * @constructor
 * @param {XChainId} from - bridge from.
 * @param {XChainId} to - bridge to.
 */

type XCallRoute = XChainId[];

export const useXCallRoute = (from: XChainId, to: XChainId): XCallRoute => {
  return useMemo(() => {
    if (from === '0x1.icon' || to === '0x1.icon') return [from, to];
    else return [from, '0x1.icon', to];
  }, [from, to]);
};

export default useXCallRoute;
