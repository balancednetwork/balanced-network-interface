import { getXChainType } from '@sodax/wallet-sdk';
import { useState, useEffect } from 'react';
import type { ChainId } from '@sodax/types';
import { getWagmiChainId } from '@sodax/wallet-sdk';
import { useXService } from '@balancednetwork/xwagmi';
import type { EvmXService } from '@balancednetwork/xwagmi';

export function useWalletProviderOptions(xChainId: ChainId | undefined) {
  const xChainType = getXChainType(xChainId);
  const evmXService = useXService('EVM') as EvmXService | undefined;
  const [options, setOptions] = useState<{ walletClient: any; publicClient: any } | undefined>(undefined);

  useEffect(() => {
    async function getOptions() {
      if (!xChainId || !evmXService) {
        setOptions(undefined);
        return;
      }

      switch (xChainType) {
        case 'EVM': {
          const wagmiChainId = getWagmiChainId(xChainId);
          const publicClient = evmXService.getPublicClient(wagmiChainId);
          const walletClient = await evmXService.getWalletClient(wagmiChainId);
          setOptions({ walletClient, publicClient });
          break;
        }
        default:
          setOptions(undefined);
      }
    }

    getOptions();
  }, [xChainType, evmXService, xChainId]);

  return options;
}
