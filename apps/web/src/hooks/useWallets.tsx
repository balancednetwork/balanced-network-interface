import { xChains } from '@/constants/xChains';
import { XChainId } from '@/types';
import { getXChainType } from '@/xwagmi/actions';
import { useXAccounts } from '@/xwagmi/hooks';
import { useMemo } from 'react';

export function useSignedInWallets(): { address: string; xChainId: XChainId }[] {
  const xAccounts = useXAccounts();
  return useMemo(
    () =>
      xChains
        .map(({ xChainId }) => {
          const xChainType = getXChainType(xChainId);
          if (xChainType) {
            return { xChainId, address: xAccounts[xChainType]?.address };
          } else {
            return { xChainId, address: undefined };
          }
        })
        .filter(w => !!w.address) as { address: string; xChainId: XChainId }[],
    [xAccounts],
  );
}
