import {
  type EvmSpokeChainConfig,
  EvmSpokeProvider,
  IconSpokeChainConfig,
  IconSpokeProvider,
  SolanaChainConfig,
  SolanaSpokeProvider,
  SpokeProvider,
  StellarSpokeChainConfig,
  StellarSpokeProvider,
  SuiSpokeChainConfig,
  SuiSpokeProvider,
  spokeChainConfig,
} from '@sodax/sdk';
import type {
  IEvmWalletProvider,
  IIconWalletProvider,
  ISolanaWalletProvider,
  IStellarWalletProvider,
  ISuiWalletProvider,
  SpokeChainId,
} from '@sodax/types';
import { getXChainType } from '@sodax/wallet-sdk';
import { useMemo } from 'react';

import { useWalletProvider } from './useWalletProvider';

export function useSpokeProvider(spokeChainId: SpokeChainId | undefined): SpokeProvider | undefined {
  const xChainType = getXChainType(spokeChainId);
  const walletProvider = useWalletProvider(spokeChainId);

  const spokeProvider = useMemo(() => {
    if (!walletProvider) return undefined;
    if (!spokeChainId) return undefined;

    if (xChainType === 'EVM') {
      return new EvmSpokeProvider(
        walletProvider as IEvmWalletProvider,
        spokeChainConfig[spokeChainId] as EvmSpokeChainConfig,
      );
    }

    if (xChainType === 'ICON') {
      return new IconSpokeProvider(
        walletProvider as IIconWalletProvider,
        spokeChainConfig[spokeChainId] as IconSpokeChainConfig,
      );
    }

    if (xChainType === 'SUI') {
      return new SuiSpokeProvider(
        spokeChainConfig[spokeChainId] as SuiSpokeChainConfig,
        walletProvider as ISuiWalletProvider,
      );
    }

    if (xChainType === 'STELLAR') {
      const stellarConfig = spokeChainConfig[spokeChainId] as StellarSpokeChainConfig;
      return new StellarSpokeProvider(walletProvider as IStellarWalletProvider, stellarConfig, {
        horizonRpcUrl: stellarConfig.horizonRpcUrl,
        sorobanRpcUrl: stellarConfig.sorobanRpcUrl,
      });
    }

    const solanaConfig = spokeChainConfig[spokeChainId] as SolanaChainConfig;

    if (xChainType === 'SOLANA') {
      return new SolanaSpokeProvider(walletProvider as ISolanaWalletProvider, {
        ...solanaConfig,
        rpcUrl: 'https://solana-mainnet.g.alchemy.com/v2/nCndZC8P7BdiVKkczCErdwpIgaBQpPFM',
      });
    }

    return undefined;
  }, [spokeChainId, xChainType, walletProvider]);

  return spokeProvider;
}
