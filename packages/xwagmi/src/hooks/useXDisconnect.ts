import { XChainType } from '@balancednetwork/sdk-core';
import { useDisconnectWallet } from '@mysten/dapp-kit';
import { useWallet } from '@solana/wallet-adapter-react';
import { useCallback } from 'react';
import { useDisconnect } from 'wagmi';
import { getXService } from '../actions';
import { useXWagmiStore } from '../useXWagmiStore';

export function useXDisconnect() {
  const xConnections = useXWagmiStore(state => state.xConnections);
  const unsetXConnection = useXWagmiStore(state => state.unsetXConnection);

  const { disconnectAsync } = useDisconnect();
  const { mutateAsync: suiDisconnectAsync } = useDisconnectWallet();
  const solanaWallet = useWallet();

  const disconnect = useCallback(
    async (xChainType: XChainType) => {
      switch (xChainType) {
        case 'EVM':
          await disconnectAsync();
          break;
        case 'SUI':
          await suiDisconnectAsync();
          break;
        case 'SOLANA':
          await solanaWallet.disconnect();
          break;
        default: {
          const xService = getXService(xChainType);
          const xConnectorId = xConnections[xChainType]?.xConnectorId;
          const xConnector = xConnectorId ? xService.getXConnectorById(xConnectorId) : undefined;
          await xConnector?.disconnect();
          break;
        }
      }

      unsetXConnection(xChainType);
    },
    [xConnections, unsetXConnection, disconnectAsync, suiDisconnectAsync, solanaWallet],
  );
  return disconnect;
}
