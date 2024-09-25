import { XChainType } from '@balancednetwork/sdk-core';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { XAccount } from '../types';
import { useXConnection } from './useXConnection';

export function useXAccount(xChainType: XChainType | undefined): XAccount {
  const xConnection = useXConnection(xChainType);
  const { address: evmAddress } = useAccount();
  const suiAccount = useCurrentAccount();

  const xAccount = useMemo((): XAccount => {
    if (!xChainType) {
      return {
        address: undefined,
        xChainType: undefined,
      };
    }

    switch (xChainType) {
      case 'EVM':
        return {
          address: evmAddress as string,
          xChainType,
        };
      case 'SUI':
        return {
          address: suiAccount?.address,
          xChainType,
        };
      default:
        return xConnection?.xAccount || { address: undefined, xChainType };
    }
  }, [xChainType, xConnection, evmAddress, suiAccount]);

  return xAccount;
}
