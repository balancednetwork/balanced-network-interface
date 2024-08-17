import { XChainType } from '@/types';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXAccount(xChainType: XChainType) {
  const xConnection = useXWagmiStore(state => state.xConnections?.[xChainType]);
  const { address: evmAddress } = useAccount();

  const xAccount = useMemo(() => {
    if (xChainType === 'EVM') {
      return evmAddress;
    } else {
      return xConnection?.account;
    }
  }, [xConnection, evmAddress, xChainType]);

  return xAccount;
}
