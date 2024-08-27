import { xChains } from '@/constants/xChains';
import { getXChainType } from '@/xwagmi/actions';
import { useXAccounts } from '@/xwagmi/hooks';
import { XChainId } from '@/xwagmi/types';
import { useMemo } from 'react';

export function useSignedInWallets(): { address: string; xChainId: XChainId }[] {
  const xAccounts = useXAccounts();
  const signedIn = useMemo(
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
  return signedIn;
}
