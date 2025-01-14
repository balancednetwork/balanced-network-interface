import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { getXPublicClient } from '@/actions';
import { ICON_XCALL_NETWORK_ID } from '@/constants';
import { FROM_SOURCES, TO_SOURCES, xChainMap } from '@/constants/xChains';
import { XPublicClient } from '@/core';
import { useXPublicClient } from '@/hooks';
import { XChainId } from '@/types';
import { formatUnits } from 'viem';
import { IXCallFee } from '../types';

export const getXCallFee = async (from: XChainId, to: XChainId, sourceXPublicClient?: XPublicClient) => {
  if (from === ICON_XCALL_NETWORK_ID && from === to) {
    return {
      rollback: 0n,
      noRollback: 0n,
    };
  }
  if (!sourceXPublicClient) {
    sourceXPublicClient = getXPublicClient(from);
  }

  const nid: XChainId = from === '0x1.icon' ? to : '0x1.icon';
  const sources = from === '0x1.icon' ? TO_SOURCES[to] : FROM_SOURCES[from];

  const feeWithRollback = await sourceXPublicClient.getXCallFee(from, nid, true, sources);
  const feeNoRollback = await sourceXPublicClient.getXCallFee(from, nid, false, sources);

  return {
    rollback: feeWithRollback,
    noRollback: feeNoRollback,
  };
};

export const useXCallFee = (
  from: XChainId,
  to: XChainId,
): { xCallFee: IXCallFee | undefined; formattedXCallFee: string } => {
  const sourceXPublicClient = useXPublicClient(from);

  const { data: xCallFee } = useQuery({
    queryKey: [`xcall-fees`, from, to],
    queryFn: () => getXCallFee(from, to, sourceXPublicClient),
    enabled: !!sourceXPublicClient,
  });

  const formattedXCallFee: string = useMemo(() => {
    return xCallFee
      ? formatUnits(xCallFee.rollback, xChainMap[from].nativeCurrency.decimals) +
          ' ' +
          xChainMap[from].nativeCurrency.symbol
      : '';
  }, [xCallFee, from]);

  return { xCallFee, formattedXCallFee };
};
