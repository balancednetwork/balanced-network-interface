import { XChainType } from '@balancednetwork/sdk-core';
import { XConnection } from '../types';
import { useXWagmiStore } from '../useXWagmiStore';
import { useAccount, useConnections } from 'wagmi';
import { useCurrentAccount, useCurrentWallet } from '@mysten/dapp-kit';
import { useMemo } from 'react';

export function useXConnection(xChainType: XChainType | undefined): XConnection | undefined {
  const xConnection = useXWagmiStore(state => (xChainType ? state.xConnections?.[xChainType] : undefined));

  const evmConnections = useConnections();
  const { address: evmAddress } = useAccount();
  const suiAccount = useCurrentAccount();
  const suiCurrentWallet = useCurrentWallet();

  const xConnection2 = useMemo(() => {
    if (!xChainType) {
      return undefined;
    }

    switch (xChainType) {
      case 'EVM':
        return {
          xAccount: { address: evmAddress as string, xChainType },
          xConnectorId: evmConnections?.[0]?.connector.id,
        };
      case 'SUI':
        if (suiCurrentWallet.currentWallet && suiCurrentWallet.connectionStatus === 'connected') {
          return {
            xAccount: { address: suiAccount?.address, xChainType },
            xConnectorId: suiCurrentWallet.currentWallet.name,
          };
        }
        return undefined;
      default:
        return xConnection;
    }
  }, [xChainType, xConnection, evmAddress, suiAccount, evmConnections, suiCurrentWallet]);

  return xConnection2;
}
