import { XChainId, XChain, XWalletType, BridgePair, MessagingProtocolId } from '../../../_xcall/types';

export const archway: XChain = {
  id: 'archway-1',
  name: 'Archway',
  xChainId: 'archway-1',
  xChainType: 'ARCHWAY',
  xWalletType: XWalletType.COSMOS,
  nativeCurrency: {
    decimals: 18,
    name: 'Archway',
    symbol: 'ARCH',
  },
  tracker: 'https://www.mintscan.io/archway/tx/',
  rpc: {
    http: 'https://rpc.mainnet.archway.io',
    ws: 'wss://rpc.mainnet.archway.io:443/websocket',
  },
  contracts: {
    xCall: 'archway19hzhgd90etqc3z2qswumq80ag2d8het38r0al0r4ulrly72t20psdrpna6',
    assetManager: 'archway1sg2kgqjhj7vyu0x9tflx4ju9vjn2x6c7g39vx3tv9ethfg9d9zns6ajpja',
    bnUSD: 'archway1l3m84nf7xagkdrcced2y0g367xphnea5uqc3mww3f83eh6h38nqqxnsxz7',
    liquidSwap: 'archway1ywv0gxrw3kv25kn9f05dtqf6577fer5pc2vewvgcagpm5p8l4kuqc4qfp6',
  },
  autoExecution: true,
  gasThreshold: 5,
};

export const archwayTestnet: XChain = {
  id: 'archway',
  name: 'archway testnet',
  xChainId: 'archway-1',
  xChainType: 'ARCHWAY',
  xWalletType: XWalletType.COSMOS,
  nativeCurrency: {
    decimals: 18,
    name: 'Archway',
    symbol: 'ARCH',
  },
  tracker: 'https://www.mintscan.io/archway/tx/',
  rpc: {
    http: 'https://rpc.mainnet.archway.io',
    ws: 'wss://rpc.mainnet.archway.io:443/websocket',
  },
  contracts: {
    xCall: 'archway1h04c8eqr99dnsw6wqx80juj2vtuxth70eh65cf6pnj4zan6ms4jqshc5wk',
    assetManager: 'archway1sg2kgqjhj7vyu0x9tflx4ju9vjn2x6c7g39vx3tv9ethfg9d9zns6ajpja',
    bnUSD: 'archway1l3m84nf7xagkdrcced2y0g367xphnea5uqc3mww3f83eh6h38nqqxnsxz7',
    liquidSwap: 'archway1ywv0gxrw3kv25kn9f05dtqf6577fer5pc2vewvgcagpm5p8l4kuqc4qfp6',
  },
  autoExecution: true,
  gasThreshold: 5,
};

export const icon: XChain = {
  id: 1,
  name: 'ICON',
  xChainId: '0x1.icon',
  xChainType: 'ICON',
  xWalletType: XWalletType.ICON,
  tracker: '',
  nativeCurrency: {
    decimals: 18,
    name: 'ICON',
    symbol: 'ICX',
  },
  rpc: {
    http: '',
    ws: 'wss://ctz.solidwallet.io/api/v3/icon_dex/block',
  },
  contracts: {
    xCall: 'cxa07f426062a1384bdd762afa6a87d123fbc81c75',
    assetManager: 'cxabea09a8c5f3efa54d0a0370b14715e6f2270591',
    bnUSD: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
    liquidSwap: '',
  },
  autoExecution: true,
  gasThreshold: 4,
};

export const lisbon: XChain = {
  id: 2,
  name: 'Lisbon Testnet',
  xChainId: '0x2.icon',
  xChainType: 'ICON',
  xWalletType: XWalletType.ICON,
  tracker: '',
  nativeCurrency: {
    decimals: 18,
    name: 'ICON',
    symbol: 'ICX',
  },
  rpc: {
    http: '',
    ws: 'wss://ctz.solidwallet.io/api/v3/icon_dex/block',
  },
  contracts: {
    xCall: 'cx15a339fa60bd86225050b22ea8cd4a9d7cd8bb83',
    assetManager: 'cxabea09a8c5f3efa54d0a0370b14715e6f2270591',
    bnUSD: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
    liquidSwap: '',
  },
  autoExecution: true,
  gasThreshold: 4,
};

export const avalanche: XChain = {
  id: 43_114,
  name: 'Avalanche',
  xChainId: '0xa86a.avax',
  xChainType: 'EVM',
  xWalletType: XWalletType.EVM,
  tracker: 'https://snowscan.xyz',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpc: {
    http: 'https://api.avax.network/ext/bc/C/rpc',
  },
  contracts: {
    xCall: '0xfC83a3F252090B26f92F91DFB9dC3Eb710AdAf1b',
    assetManager: '0xdf851B4f0D9b2323e03B3980b1C4Cf56273c0bd9',
    bnUSD: '0xdBDd50997361522495EcFE57EBb6850dA0E4C699',
  },
  autoExecution: true,
  gasThreshold: 0,
};

export const fuji: XChain = {
  id: 43_113,
  name: 'Fuji Testnet',
  xChainId: '0xa869.fuji',
  xChainType: 'EVM',
  xWalletType: XWalletType.EVM,
  tracker: 'https://snowscan.xyz',
  nativeCurrency: {
    decimals: 18,
    name: 'Avalanche',
    symbol: 'AVAX',
  },
  rpc: {
    http: 'https://api.avax.network/ext/bc/C/rpc',
  },
  contracts: {
    xCall: '0x28ecb198e86a7FcA1cf51032635967fc26cDDAaD',
    assetManager: '0xdf851B4f0D9b2323e03B3980b1C4Cf56273c0bd9',
    bnUSD: '0xdBDd50997361522495EcFE57EBb6850dA0E4C699',
  },
  autoExecution: true,
  gasThreshold: 0,
};

export const xChains = [
  archway,
  icon,
  avalanche,
  // add testnets
  archwayTestnet,
  lisbon,
  fuji,
];

export const xChainMap: { [key in XChainId]: XChain } = {
  '0x1.icon': icon,
  '0x2.icon': lisbon,
  '0xa869.fuji': fuji,
  '0xa86a.avax': avalanche,
  archway: archwayTestnet,
  'archway-1': archway,
};

export const sortChains = (a: XChainId, b: XChainId): [XChainId, XChainId] => {
  return a.localeCompare(b) > 0 ? [a, b] : [b, a];
};

export const BRIDGE_PAIRS: BridgePair[] = [
  { chains: sortChains('0x1.icon', 'archway-1'), protocol: MessagingProtocolId.IBC },
  { chains: sortChains('0x1.icon', '0xa86a.avax'), protocol: MessagingProtocolId.C_RELAY },
];
