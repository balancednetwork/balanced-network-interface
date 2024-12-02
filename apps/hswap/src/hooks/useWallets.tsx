import { getXChainType } from '@balancednetwork/xwagmi/actions';
import { xChains } from '@balancednetwork/xwagmi/constants/xChains';
import { useXAccounts } from '@balancednetwork/xwagmi/hooks';
import { XChainId } from '@balancednetwork/xwagmi/types';
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

export function useHasSignedIn(): boolean {
  const wallets = useSignedInWallets();
  return wallets.length > 0;
}
