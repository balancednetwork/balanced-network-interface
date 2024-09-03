import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { XChainType } from '../types';
import { XAccount } from '../types';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXAccounts() {
  const xChainTypes = useXWagmiStore(state => Object.keys(state.xServices));
  const xConnections = useXWagmiStore(state => state.xConnections);
  const { address: evmAddress } = useAccount();

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
    return result;
  }, [xConnections, evmAddress, xChainTypes]);

  return xAccounts;
}
