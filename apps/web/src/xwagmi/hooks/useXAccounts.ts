import { useMemo } from 'react';
import { useAccount } from 'wagmi';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXAccounts() {
  const xConnections = useXWagmiStore(state => state.xConnections);
  const { address: evmAddress } = useAccount();

  const xAccounts = useMemo(() => {
    const result = {};
    for (const xChainType of Object.keys(xConnections)) {
      const xConnection = xConnections[xChainType];

      if (xConnection.account) {
        result[xConnection.xConnector.xChainType] = xConnection.account;
      }
    }

    if (evmAddress) {
      result['EVM'] = evmAddress;
    }
    return result;
  }, [xConnections, evmAddress]);

  return xAccounts;
}
