import { http, createConfig } from 'wagmi';
import { avalanche, avalancheFuji } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';
import { createConfig as createCoreConfig } from '@wagmi/core';
export const noopStorage = {
  getItem: (_key: any) => '',
  setItem: (_key: any, _value: any) => null,
  removeItem: (_key: any) => null,
};

export const wagmiConfig = createConfig({
  chains: [avalanche, avalancheFuji],
  connectors: [
    walletConnect({
      projectId: '6757abd2c11f58508b9bc73a9c8fed85',
      qrModalOptions: {
        themeVariables: {
          '--wcm-z-index': '999999',
        },
      },
    }),
  ],
  transports: {
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
  },
});

export const coreConfig = createCoreConfig({
  chains: [avalanche, avalancheFuji],
  transports: {
    [avalanche.id]: http(),
    [avalancheFuji.id]: http(),
  },
});
