import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { FROM_SOURCES, TO_SOURCES, xChainMap } from '@/constants/xChains';
import { XChainId } from '@/types';
import { formatEther } from 'viem';
import { useXServiceStore } from '../_zustand/useXServiceStore';
import { IXCallFee } from '../types';

const useXCallFee = (from: XChainId, to: XChainId): { xCallFee: IXCallFee | undefined; formattedXCallFee: string } => {
  const sourcePublicXService = useXServiceStore(state => state.getXPublicClient(from));

  const { data: xCallFee } = useQuery({
    queryKey: [`xcall-fees`, from, to],
    queryFn: async () => {
      const nid: XChainId = from === '0x1.icon' ? to : '0x1.icon';
      const sources = from === '0x1.icon' ? TO_SOURCES[to] : FROM_SOURCES[from];

      const feeWithRollback = await sourcePublicXService.getXCallFee(nid, true, sources);
      const feeNoRollback = await sourcePublicXService.getXCallFee(nid, false, sources);

      return {
        rollback: feeWithRollback,
        noRollback: feeNoRollback,
      };
    },
    enabled: !!sourcePublicXService,
  });

  const formattedXCallFee: string = useMemo(() => {
    return xCallFee ? formatEther(xCallFee.rollback) + ' ' + xChainMap[from].nativeCurrency.symbol : '';
  }, [xCallFee, from]);

  return { xCallFee, formattedXCallFee };
};

export default useXCallFee;
