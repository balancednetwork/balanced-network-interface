import { XChainType } from '@/types';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { XAccount, XConnection } from '../core/types';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXAccount(xChainType: XChainType) {
  const xConnection: XConnection = useXWagmiStore(state => state.xConnections?.[xChainType]);
  const { address: evmAddress } = useAccount();

  const xAccount: XAccount = useMemo((): XAccount => {
    if (xChainType === 'EVM') {
      return {
        address: evmAddress as string,
        xChainType,
      };
    } else {
      return xConnection?.xAccount || { address: undefined, xChainType };
    }
  }, [xConnection, evmAddress, xChainType]);

  return xAccount;
}
