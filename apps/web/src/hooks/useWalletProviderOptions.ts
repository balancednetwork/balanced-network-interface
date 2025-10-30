import { CHAIN_INFO, SupportedChainId } from '@balancednetwork/balanced-js';
import { getXChainType, useXAccount, useXService } from '@balancednetwork/xwagmi';
import type { EvmXService, SolanaXService, StellarXService, SuiXService, XChainId } from '@balancednetwork/xwagmi';
import type { ChainId } from '@sodax/types';
import { useEffect, useState } from 'react';
import { Account, Chain, PublicClient, Transport, WalletClient } from 'viem';

export type EVMWalletProviderOptions = {
  walletClient: WalletClient<Transport, Chain, Account>;
  publicClient: PublicClient;
};
export type ICONWalletProviderOptions = { walletAddress: string; rpcUrl: string };
export type SuiWalletProviderOptions = { client: any; wallet: any; account: any };
export type StellarWalletProviderOptions = { walletsKit: any; network: any; service: StellarXService };
export type SolanaWalletProviderOptions = { service: SolanaXService };
export type WalletProviderOptions =
  | EVMWalletProviderOptions
  | ICONWalletProviderOptions
  | SuiWalletProviderOptions
  | StellarWalletProviderOptions
  | SolanaWalletProviderOptions;

export const getWagmiChainId = (xChainId: XChainId): number => {
  const xChainMap = {
    '0xa869.fuji': 43113,
    'sonic-blaze': 57054,
    sonic: 146,
    '0xa86a.avax': 43114,
    '0x38.bsc': 56,
    '0xa4b1.arbitrum': 42161,
    '0x2105.base': 8453,
    '0xa.optimism': 10,
    '0x89.polygon': 137,
    hyper: 999,
  };
  return xChainMap[xChainId] ?? 0;
};

export function useWalletProviderOptions(xChainId: ChainId | undefined): WalletProviderOptions | undefined {
  const xChainType = getXChainType(xChainId as XChainId);
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
          const wagmiChainId = getWagmiChainId(xChainId as XChainId);
          const publicClient = evmXService.getPublicClient(wagmiChainId);
          const walletClient: WalletClient = await evmXService.getWalletClient(wagmiChainId);
          if (!walletClient?.account || !publicClient) return;
          setOptions({ walletClient: walletClient as WalletClient<Transport, Chain, Account>, publicClient });
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

        case 'STELLAR': {
          if (!xService) return;
          const stellarXService = xService as unknown as StellarXService;
          setOptions({ walletsKit: stellarXService.walletsKit, network: 'PUBLIC', service: stellarXService });
          break;
        }

        case 'SOLANA': {
          if (!xService) return;
          const solanaXService = xService as unknown as SolanaXService;
          setOptions({ service: solanaXService });
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
