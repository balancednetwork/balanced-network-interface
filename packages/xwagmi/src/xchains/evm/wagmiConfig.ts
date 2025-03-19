import { http, createConfig } from 'wagmi';
import { arbitrum, avalanche, avalancheFuji, base, bsc, mainnet, optimism, polygon } from 'wagmi/chains';

export const wagmiConfig = createConfig({
  chains: [avalanche, bsc, avalancheFuji, arbitrum, base, optimism, polygon],
  connectors: [],
  transports: {
    [mainnet.id]: http(),
    [avalanche.id]: http(),
    [bsc.id]: http('https://binance.llamarpc.com'),
    [avalancheFuji.id]: http(),
    [arbitrum.id]: http(),
    [optimism.id]: http(),
    [base.id]: http(),
    [polygon.id]: http('https://polygon.llamarpc.com'),
  },
});
