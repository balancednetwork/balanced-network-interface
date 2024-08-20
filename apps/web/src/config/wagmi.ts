import { http, createConfig } from 'wagmi';
import { avalanche, avalancheFuji, bsc, arbitrum, base, mainnet } from 'wagmi/chains';
// import { walletConnect } from 'wagmi/connectors';
import { createConfig as createCoreConfig } from '@wagmi/core';
import { Chain, PublicClient, createPublicClient } from 'viem';
export const noopStorage = {
  getItem: (_key: any) => '',
  setItem: (_key: any, _value: any) => null,
  removeItem: (_key: any) => null,
};

export const wagmiConfig = createConfig({
  chains: [mainnet, avalanche, bsc, avalancheFuji, arbitrum, base],
  connectors: [
    // walletConnect({
    //   projectId: '6757abd2c11f58508b9bc73a9c8fed85',
    //   qrModalOptions: {
    //     themeVariables: {
    //       '--wcm-z-index': '999999',
    //     },
    //   },
    // }),
  ],
  transports: {
    [mainnet.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http(),
    [avalancheFuji.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});

export const coreConfig = createCoreConfig({
  chains: [avalanche, bsc, avalancheFuji, arbitrum, base],
  transports: {
    [mainnet.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http(),
    [avalancheFuji.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});

export const CHAINS: [Chain, ...Chain[]] = [bsc, arbitrum, avalanche, base];

export enum ChainId {
  ETHEREUM = 1,
  GOERLI = 5,
  BSC = 56,
  BSC_TESTNET = 97,
  ZKSYNC_TESTNET = 280,
  ZKSYNC = 324,
  OPBNB_TESTNET = 5611,
  OPBNB = 204,
  POLYGON_ZKEVM = 1101,
  POLYGON_ZKEVM_TESTNET = 1442,
  ARBITRUM_ONE = 42161,
  ARBITRUM_GOERLI = 421613,
  SCROLL_SEPOLIA = 534351,
  LINEA = 59144,
  LINEA_TESTNET = 59140,
  LINEA_SEPOLIA = 59141,
  BASE = 8453,
  BASE_TESTNET = 84531,
}

export function createViemPublicClients() {
  return CHAINS.reduce(
    (prev, cur: Chain) => {
      return {
        ...prev,
        [cur.id]: createPublicClient({
          chain: cur,
          transport: http(cur.rpcUrls.default.http[0]),
          pollingInterval: 6_000,
        }),
      };
    },
    {} as Record<ChainId, PublicClient>,
  );
}

export const viemClients = createViemPublicClients();
