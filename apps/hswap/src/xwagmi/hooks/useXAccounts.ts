import { XChainType } from '@balancednetwork/sdk-core';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { XAccount } from '../types';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXAccounts() {
  const xChainTypes = useXWagmiStore(state => Object.keys(state.xServices));
  const xConnections = useXWagmiStore(state => state.xConnections);
  const { address: evmAddress } = useAccount();
  const suiAccount = useCurrentAccount();

  const xAccounts = useMemo(() => {
    const result: Partial<Record<XChainType, XAccount>> = {};
    for (const xChainType of xChainTypes) {
      const xConnection = xConnections[xChainType];

      if (xConnection?.xAccount) {
        result[xChainType] = xConnection.xAccount;
      } else {
        result[xChainType] = {
          address: undefined,
          xChainType,
        };
      }
    }

    if (evmAddress) {
      result['EVM'] = {
        address: evmAddress,
        xChainType: 'EVM',
      };
    }
    if (suiAccount) {
      result['SUI'] = {
        address: suiAccount.address,
        xChainType: 'SUI',
      };
    }
    return result;
  }, [xChainTypes, xConnections, evmAddress, suiAccount]);

  return xAccounts;
}
