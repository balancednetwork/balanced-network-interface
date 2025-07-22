import {
  EvmSpokeProvider,
  IconSpokeChainConfig,
  IconSpokeProvider,
  spokeChainConfig,
  SpokeProvider,
  SuiSpokeProvider,
  SuiSpokeChainConfig,
  type EvmSpokeChainConfig,
} from '@sodax/sdk';
import type { IEvmWalletProvider, IIconWalletProvider, ISuiWalletProvider, SpokeChainId } from '@sodax/types';
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

    return undefined;
  }, [spokeChainId, xChainType, walletProvider]);

  return spokeProvider;
}
