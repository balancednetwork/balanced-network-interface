import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { FROM_SOURCES, TO_SOURCES, xChainMap } from '@/xwagmi/constants/xChains';
import { useXPublicClient } from '@/xwagmi/hooks';
import { XChainId } from '@/xwagmi/types';
import { formatEther } from 'viem';
import { IXCallFee } from '../types';

const useXCallFee = (from: XChainId, to: XChainId): { xCallFee: IXCallFee | undefined; formattedXCallFee: string } => {
  const sourceXPublicClient = useXPublicClient(from);

  const { data: xCallFee } = useQuery({
    queryKey: [`xcall-fees`, from, to],
    queryFn: async () => {
      if (!sourceXPublicClient) return;

      const nid: XChainId = from === '0x1.icon' ? to : '0x1.icon';
      const sources = from === '0x1.icon' ? TO_SOURCES[to] : FROM_SOURCES[from];

      const feeWithRollback = await sourceXPublicClient.getXCallFee(from, nid, true, sources);
      const feeNoRollback = await sourceXPublicClient.getXCallFee(from, nid, false, sources);

      return {
        rollback: feeWithRollback,
        noRollback: feeNoRollback,
      };
    },
    enabled: !!sourceXPublicClient,
  });

  const formattedXCallFee: string = useMemo(() => {
    return xCallFee ? formatEther(xCallFee.rollback) + ' ' + xChainMap[from].nativeCurrency.symbol : '';
  }, [xCallFee, from]);

  return { xCallFee, formattedXCallFee };
};

export default useXCallFee;
