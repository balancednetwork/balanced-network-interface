import { XChainType } from '@balancednetwork/sdk-core';
import { useMemo } from 'react';
import { XAccount } from '../types';
import { useXConnection } from './useXConnection';

export function useXAccount(xChainType: XChainType | undefined): XAccount {
  const xConnection = useXConnection(xChainType);

  const xAccount = useMemo((): XAccount => {
    if (!xChainType) {
      return {
        address: undefined,
        xChainType: undefined,
      };
    }

    return xConnection?.xAccount || { address: undefined, xChainType };
  }, [xChainType, xConnection]);

  return xAccount;
}
