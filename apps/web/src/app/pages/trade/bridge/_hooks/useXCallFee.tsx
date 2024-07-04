import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { IXCallFee, XChainId } from '../types';
import { FROM_SOURCES, TO_SOURCES, xChainMap } from '../_config/xChains';
import { formatEther } from 'viem';
import { useXServiceStore } from '../_zustand/useXServiceStore';

const useXCallFee = (from: XChainId, to: XChainId): { xCallFee: IXCallFee | undefined; formattedXCallFee: string } => {
  const sourcePublicXService = useXServiceStore(state => state.getPublicXService(from));

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
