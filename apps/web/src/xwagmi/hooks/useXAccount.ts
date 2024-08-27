import { XChainType } from '@/types';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { XAccount } from '../types';
import { useXConnection } from './useXConnection';

export function useXAccount(xChainType: XChainType | undefined): XAccount {
  const xConnection = useXConnection(xChainType);
  const { address: evmAddress } = useAccount();

  const xAccount = useMemo((): XAccount => {
    if (!xChainType) {
      return {
        address: undefined,
        xChainType: undefined,
      };
    }

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
