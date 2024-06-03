import { XChainId, XChain, XWalletType, BridgePair, MessagingProtocolId } from '../types';

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
    sources: [],
    xCall: 'archway19hzhgd90etqc3z2qswumq80ag2d8het38r0al0r4ulrly72t20psdrpna6',
    assetManager: 'archway1sg2kgqjhj7vyu0x9tflx4ju9vjn2x6c7g39vx3tv9ethfg9d9zns6ajpja',
    bnUSD: 'archway1l3m84nf7xagkdrcced2y0g367xphnea5uqc3mww3f83eh6h38nqqxnsxz7',
    liquidSwap: 'archway1ywv0gxrw3kv25kn9f05dtqf6577fer5pc2vewvgcagpm5p8l4kuqc4qfp6',
  },
  autoExecution: true,
  gasThreshold: 1,
  testnet: false,
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
    sources: [],
    xCall: 'archway1h04c8eqr99dnsw6wqx80juj2vtuxth70eh65cf6pnj4zan6ms4jqshc5wk',
    assetManager: 'archway1sg2kgqjhj7vyu0x9tflx4ju9vjn2x6c7g39vx3tv9ethfg9d9zns6ajpja',
    bnUSD: 'archway1l3m84nf7xagkdrcced2y0g367xphnea5uqc3mww3f83eh6h38nqqxnsxz7',
    liquidSwap: 'archway1ywv0gxrw3kv25kn9f05dtqf6577fer5pc2vewvgcagpm5p8l4kuqc4qfp6',
  },
  autoExecution: true,
  gasThreshold: 5,
  testnet: true,
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
    sources: [],
    xCall: 'cxa07f426062a1384bdd762afa6a87d123fbc81c75',
    assetManager: 'cxabea09a8c5f3efa54d0a0370b14715e6f2270591',
    bnUSD: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
    liquidSwap: '',
  },
  autoExecution: true,
  gasThreshold: 1,
  testnet: false,
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
    sources: [],
    xCall: 'cx15a339fa60bd86225050b22ea8cd4a9d7cd8bb83',
    assetManager: 'cxabea09a8c5f3efa54d0a0370b14715e6f2270591',
    bnUSD: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
    liquidSwap: '',
  },
  autoExecution: true,
  gasThreshold: 4,
  testnet: true,
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
    sources: ['0xC1a39C4e7AA98DEC394eF54559960873Bd619cA3', '0x7F3665eF19258cD5cE15eA39d014F47Fc942AE0C'],
    xCall: '0xfC83a3F252090B26f92F91DFB9dC3Eb710AdAf1b',
    assetManager: '0xdf851B4f0D9b2323e03B3980b1C4Cf56273c0bd9',
    bnUSD: '0xdBDd50997361522495EcFE57EBb6850dA0E4C699',
  },
  autoExecution: true,
  gasThreshold: 0.01,
  testnet: false,
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
    sources: [],
    xCall: '0x28ecb198e86a7FcA1cf51032635967fc26cDDAaD',
    assetManager: '0xdf851B4f0D9b2323e03B3980b1C4Cf56273c0bd9',
    bnUSD: '0xdBDd50997361522495EcFE57EBb6850dA0E4C699',
  },
  autoExecution: true,
  gasThreshold: 0,
  testnet: true,
};

export const bsc: XChain = {
  id: 56,
  name: 'BNB Chain',
  xChainId: '0x38.bsc',
  xChainType: 'EVM',
  xWalletType: XWalletType.EVM,
  tracker: 'https://bscscan.com/',
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpc: {
    http: 'https://bsc-dataseed.bnbchain.org',
  },
  contracts: {
    sources: ['0x24415977c566f9300Ea6F0aC75AEA0c09C500e46'],
    xCall: '0xfc83a3f252090b26f92f91dfb9dc3eb710adaf1b',
    assetManager: '0x69e81Cea7889608A63947814893ad1B86DcC03Aa',
    bnUSD: '0xc65132325bD4FcF2Ec5F3a9375487163B6999206',
  },
  autoExecution: true,
  gasThreshold: 0,
  testnet: false,
};

export const xChainMap: { [key in XChainId]: XChain } = {
  '0x1.icon': icon,
  '0x2.icon': lisbon,
  '0xa869.fuji': fuji,
  '0xa86a.avax': avalanche,
  archway: archwayTestnet,
  'archway-1': archway,
  '0x38.bsc': bsc,
};

export const xChains = Object.values(xChainMap).filter(xChain => !xChain.testnet);

export const sortChains = (a: XChainId, b: XChainId): [XChainId, XChainId] => {
  return a.localeCompare(b) > 0 ? [a, b] : [b, a];
};

export const BRIDGE_PAIRS: BridgePair[] = [
  { chains: sortChains('0x1.icon', 'archway-1'), protocol: MessagingProtocolId.IBC },
  { chains: sortChains('0x1.icon', '0xa86a.avax'), protocol: MessagingProtocolId.C_RELAY },
];
