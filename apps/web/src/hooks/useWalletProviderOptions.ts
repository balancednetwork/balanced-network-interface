import { CHAIN_INFO, SupportedChainId } from '@balancednetwork/balanced-js';
import { useXAccount, useXService } from '@balancednetwork/xwagmi';
import type { EvmXService, SuiXService, XChainId } from '@balancednetwork/xwagmi';
import type { ChainId } from '@sodax/types';
import { getXChainType } from '@sodax/wallet-sdk';
import { getWagmiChainId } from '@sodax/wallet-sdk';
import { useEffect, useState } from 'react';

export type EVMWalletProviderOptions = { walletClient: any; publicClient: any };
export type ICONWalletProviderOptions = { walletAddress: string; rpcUrl: string };
export type SuiWalletProviderOptions = { client: any; wallet: any; account: any };
export type WalletProviderOptions = EVMWalletProviderOptions | ICONWalletProviderOptions | SuiWalletProviderOptions;

export function useWalletProviderOptions(xChainId: ChainId | undefined): WalletProviderOptions | undefined {
  const xChainType = getXChainType(xChainId);
  const evmXService = useXService('EVM') as EvmXService | undefined;
  const xService = useXService(xChainType);
  const xAccount = useXAccount(xChainType);

  const [options, setOptions] = useState<WalletProviderOptions | undefined>(undefined);

  useEffect(() => {
    async function getOptions() {
      if (!xChainId) {
        setOptions(undefined);
        return;
      }

      switch (xChainType) {
        case 'EVM': {
          if (!evmXService) return;
          const wagmiChainId = getWagmiChainId(xChainId);
          const publicClient = evmXService.getPublicClient(wagmiChainId);
          const walletClient = await evmXService.getWalletClient(wagmiChainId);
          setOptions({ walletClient, publicClient });
          break;
        }
        case 'SUI': {
          if (!xService) return;
          const suiXService = xService as unknown as SuiXService;
          setOptions({ client: suiXService.suiClient, wallet: suiXService.suiWallet, account: suiXService.suiAccount });
          break;
        }
        case 'ICON': {
          if (!xAccount.address) return;
          setOptions({
            walletAddress: xAccount.address,
            rpcUrl: CHAIN_INFO[SupportedChainId.MAINNET].APIEndpoint,
          });
          break;
        }
        default:
          setOptions(undefined);
      }
    }

    getOptions();
  }, [xChainType, xService, evmXService, xChainId, xAccount.address]);

  return options;
}
