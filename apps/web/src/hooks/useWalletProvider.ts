import { ChainId } from '@sodax/types';
import { EvmWalletProvider, getXChainType } from '@sodax/wallet-sdk';
import { useMemo } from 'react';
import { useWalletProviderOptions } from './useWalletProviderOptions';

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

      default:
        return undefined;
    }
  }, [xChainType, walletProviderOptions]);
}
