import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { IXCallFee, XChainId } from '../types';
import { xChainMap } from '../_config/xChains';
import { formatEther } from 'viem';
import { useXServiceStore } from '../_zustand/useXServiceStore';

const useXCallFee = (from: XChainId, to: XChainId): { xCallFee: IXCallFee | undefined; formattedXCallFee: string } => {
  const sourcePublicXService = useXServiceStore(state => state.getPublicXService(from));

  const { data: xCallFee } = useQuery({
    queryKey: [`xcall-fees`, from, to],
    queryFn: async () => {
      const nid = to;
      const feeWithRollback = await sourcePublicXService.getXCallFee(nid, true);
      const feeNoRollback = await sourcePublicXService.getXCallFee(nid, false);

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
