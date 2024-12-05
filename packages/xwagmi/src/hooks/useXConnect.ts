import { useConnectWallet } from '@mysten/dapp-kit';
import { useCallback } from 'react';
import { useConnect } from 'wagmi';
import { XConnector } from '../core/XConnector';
import { useXWagmiStore } from '../useXWagmiStore';
import { EvmXConnector } from '../xchains/evm';
import { SuiXConnector } from '../xchains/sui';
import { useWallet } from '@solana/wallet-adapter-react';
import { SolanaXConnector } from '../xchains/solana';

export function useXConnect() {
  const setXConnection = useXWagmiStore(state => state.setXConnection);

  const { connectAsync: evmConnectAsync } = useConnect();
  const { mutateAsync: suiConnectAsync } = useConnectWallet();
  const solanaWallet = useWallet();

  const connect = useCallback(
    async (xConnector: XConnector) => {
      const xChainType = xConnector.xChainType;
      let xAccount;

      switch (xChainType) {
        case 'EVM':
          await evmConnectAsync({ connector: (xConnector as EvmXConnector).connector });
          break;
        case 'SUI':
          await suiConnectAsync({ wallet: (xConnector as SuiXConnector).wallet });
          break;
        case 'SOLANA':
          {
            const walletName = (xConnector as SolanaXConnector).wallet.adapter.name;
            await solanaWallet.select(walletName);
            await solanaWallet.connect();
          }
          break;
        default:
          xAccount = await xConnector.connect();
          break;
      }

      if (xAccount) {
        setXConnection(xConnector.xChainType, {
          xAccount,
          xConnectorId: xConnector.id,
        });
      }
    },
    [setXConnection, evmConnectAsync, suiConnectAsync, solanaWallet],
  );
  return connect;
}
