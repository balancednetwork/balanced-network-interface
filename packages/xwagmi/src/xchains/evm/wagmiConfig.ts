import { defineChain } from 'viem';
import { http, type Config, createConfig } from 'wagmi';
import { arbitrum, avalanche, avalancheFuji, base, bsc, mainnet, optimism, polygon, sonic } from 'wagmi/chains';

// HyperEVM chain is not supported by viem, so we need to define it manually
export const hyper = /*#__PURE__*/ defineChain({
  id: 999,
  name: 'HyperEVM',
  nativeCurrency: {
    decimals: 18,
    name: 'HYPE',
    symbol: 'HYPE',
  },
  rpcUrls: {
    default: { http: ['https://rpc.hyperliquid.xyz/evm'] },
  },
  blockExplorers: {
    default: {
      name: 'HyperEVMScan',
      url: 'https://hyperevmscan.io/',
    },
  },
  contracts: {
    multicall3: {
      address: '0xcA11bde05977b3631167028862bE2a173976CA11',
      blockCreated: 13051,
    },
  },
});

export const wagmiConfig: Config = createConfig({
  chains: [mainnet, avalanche, bsc, avalancheFuji, arbitrum, base, optimism, polygon, sonic, hyper],
  connectors: [],
  transports: {
    [mainnet.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http('https://bsc-rpc.publicnode.com'),
    [avalancheFuji.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [polygon.id]: http('https://1rpc.io/matic'),
    [sonic.id]: http('https://sonic.drpc.org'),
    [hyper.id]: http('https://rpc.hyperliquid.xyz/evm'),
  },
});
