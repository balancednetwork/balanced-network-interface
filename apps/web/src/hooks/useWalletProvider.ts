import { getXChainType, SolanaXService, StellarXService, XChainId } from '@balancednetwork/xwagmi';
import { ChainId, IconEoaAddress } from '@sodax/types';
import {
  BrowserExtensionEvmWalletConfig,
  EvmWalletProvider,
  IconWalletProvider,
  isBrowserExtensionEvmWalletConfig,
  SolanaWalletProvider,
  StellarWalletConfig,
  StellarWalletProvider,
  SuiWalletProvider,
} from '@sodax/wallet-sdk-core';
import { useMemo } from 'react';
import {
  ICONWalletProviderOptions,
  SolanaWalletProviderOptions,
  StellarWalletProviderOptions,
  SuiWalletProviderOptions,
  useWalletProviderOptions,
} from './useWalletProviderOptions';

export function useWalletProvider(spokeChainId: ChainId | undefined) {
  const xChainType = getXChainType(spokeChainId as XChainId);
  const walletProviderOptions = useWalletProviderOptions(spokeChainId);

  return useMemo(() => {
    // Return undefined if options are still loading
    if (!walletProviderOptions) {
      return undefined;
    }

    switch (xChainType) {
      case 'EVM':
        if (isBrowserExtensionEvmWalletConfig(walletProviderOptions as BrowserExtensionEvmWalletConfig)) {
          return new EvmWalletProvider(walletProviderOptions as BrowserExtensionEvmWalletConfig);
        }
        return undefined;

      case 'SUI': {
        const { client, wallet, account } = walletProviderOptions as SuiWalletProviderOptions;

        return new SuiWalletProvider({ client, wallet, account });
      }

      case 'ICON': {
        const { walletAddress, rpcUrl } = walletProviderOptions as ICONWalletProviderOptions;

        return new IconWalletProvider({
          walletAddress: walletAddress as IconEoaAddress | undefined,
          rpcUrl: rpcUrl as `http${string}`,
        });
      }

      case 'STELLAR': {
        const { walletsKit, network } = walletProviderOptions as StellarWalletProviderOptions;

        if (!walletsKit) {
          console.error('StellarWalletsKit is not initialized');
          return undefined;
        }

        if (!network) {
          console.error('StellarNetwork is not initialized');
          return undefined;
        }

        return new StellarWalletProvider({
          type: 'BROWSER_EXTENSION',
          walletsKit,
          network,
        });
      }

      case 'SOLANA': {
        const { service } = walletProviderOptions as SolanaWalletProviderOptions;

        if (!service || !service.wallet) {
          console.error('SolanaWallet is not initialized');
          return undefined;
        }

        if (!service.connection) {
          console.error('SolanaConnection is not initialized');
          return undefined;
        }

        return new SolanaWalletProvider({
          wallet: service.wallet,
          connection: service.connection,
        });
      }

      default:
        return undefined;
    }
  }, [xChainType, walletProviderOptions]);
}
