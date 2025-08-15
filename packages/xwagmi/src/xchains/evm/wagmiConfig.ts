import { http, createConfig, type Config } from 'wagmi';
import { arbitrum, avalanche, avalancheFuji, base, bsc, mainnet, optimism, polygon } from 'wagmi/chains';

export const wagmiConfig: Config = createConfig({
  chains: [mainnet, avalanche, bsc, avalancheFuji, arbitrum, base, optimism, polygon],
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
  },
});
