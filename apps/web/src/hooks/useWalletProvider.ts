import { ChainId, IconEoaAddress } from '@sodax/types';
import { EvmWalletProvider, getXChainType, IconWalletProvider, SuiWalletProvider } from '@sodax/wallet-sdk';
import { useMemo } from 'react';
import {
  ICONWalletProviderOptions,
  SuiWalletProviderOptions,
  useWalletProviderOptions,
} from './useWalletProviderOptions';

export function useWalletProvider(spokeChainId: ChainId | undefined) {
  const xChainType = getXChainType(spokeChainId);
  const walletProviderOptions = useWalletProviderOptions(spokeChainId);

  return useMemo(() => {
    // Return undefined if options are still loading
    if (!walletProviderOptions) {
      return undefined;
    }

    switch (xChainType) {
      case 'EVM':
        // @ts-ignore
        return new EvmWalletProvider(walletProviderOptions);

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

      default:
        return undefined;
    }
  }, [xChainType, walletProviderOptions]);
}
