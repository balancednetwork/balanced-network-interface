import { XChainId } from '@balancednetwork/sdk-core';

import { XChain } from '@/types';

export const archway: XChain = {
  id: 'archway-1',
  name: 'Archway',
  xChainId: 'archway-1',
  xChainType: 'ARCHWAY',
  nativeCurrency: {
    decimals: 18,
    name: 'Archway',
    symbol: 'ARCH',
  },
  tracker: { tx: 'https://www.mintscan.io/archway/tx' },
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
  gasThreshold: 2,
  testnet: false,
  useXCallScanner: false,
};

export const archwayTestnet: XChain = {
  id: 'archway',
  name: 'archway testnet',
  xChainId: 'archway-1',
  xChainType: 'ARCHWAY',
  nativeCurrency: {
    decimals: 18,
    name: 'Archway',
    symbol: 'ARCH',
  },
  tracker: { tx: 'https://www.mintscan.io/archway/tx' },
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
  gasThreshold: 10,
  testnet: true,
  useXCallScanner: false,
};

export const icon: XChain = {
  id: 1,
  name: 'ICON',
  xChainId: '0x1.icon',
  xChainType: 'ICON',
  intentChainId: 'icon',
  tracker: { tx: 'https://tracker.icon.community/transaction' },
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
  gasThreshold: 2.5,
  testnet: false,
  useXCallScanner: false,
};

export const lisbon: XChain = {
  id: 2,
  name: 'Lisbon Testnet',
  xChainId: '0x2.icon',
  xChainType: 'ICON',
  tracker: { tx: '' },
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
  testnet: true,
  useXCallScanner: false,
};

export const avalanche: XChain = {
  id: 43_114,
  name: 'Avalanche',
  xChainId: '0xa86a.avax',
  xChainType: 'EVM',
  tracker: { tx: 'https://snowscan.xyz/tx' },
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
  gasThreshold: 0.05,
  testnet: false,
  useXCallScanner: false,
};

export const fuji: XChain = {
  id: 43_113,
  name: 'Fuji Testnet',
  xChainId: '0xa869.fuji',
  xChainType: 'EVM',
  tracker: { tx: 'https://snowscan.xyz' },
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
  testnet: true,
  useXCallScanner: false,
};

export const havah: XChain = {
  id: 'havah',
  name: 'Havah',
  xChainId: '0x100.icon',
  xChainType: 'HAVAH',
  tracker: { tx: 'https://scan.havah.io/txn' },
  nativeCurrency: {
    decimals: 18,
    name: 'Havah',
    symbol: 'HVH',
  },
  rpc: {
    http: 'https://ctz.havah.io/api/v3',
  },
  contracts: {
    // TODO: are contracts correct?
    xCall: '0xfC83a3F252090B26f92F91DFB9dC3Eb710AdAf1b',
    assetManager: '0xdf851B4f0D9b2323e03B3980b1C4Cf56273c0bd9',
    bnUSD: '0xdBDd50997361522495EcFE57EBb6850dA0E4C699',
  },
  autoExecution: true,
  gasThreshold: 0.2,
  testnet: false,
  useXCallScanner: false,
};

export const bsc: XChain = {
  id: 56,
  name: 'BNB Chain',
  xChainId: '0x38.bsc',
  xChainType: 'EVM',
  tracker: { tx: 'https://bscscan.com/tx' },
  nativeCurrency: {
    decimals: 18,
    name: 'BNB',
    symbol: 'BNB',
  },
  rpc: {
    http: 'https://bsc-dataseed.bnbchain.org',
  },
  contracts: {
    xCall: '0xfc83a3f252090b26f92f91dfb9dc3eb710adaf1b',
    assetManager: '0x69e81Cea7889608A63947814893ad1B86DcC03Aa',
    bnUSD: '0xc65132325bD4FcF2Ec5F3a9375487163B6999206',
  },
  autoExecution: true,
  gasThreshold: 0.005,
  testnet: false,
  useXCallScanner: false,
};

export const polygon: XChain = {
  id: 137,
  name: 'Polygon',
  xChainId: '0x89.polygon',
  xChainType: 'EVM',
  tracker: { tx: 'https://polygonscan.com/tx/' },
  nativeCurrency: {
    decimals: 18,
    name: 'Polygon',
    symbol: 'POL',
  },
  rpc: {
    http: 'https://polygon.llamarpc.com',
  },
  contracts: {
    xCall: '0xfC83a3F252090B26f92F91DFB9dC3Eb710AdAf1b',
    assetManager: '0x18274b9755C9d0D31e8863aDd1D6019B16a0B316',
    bnUSD: '0x9990Be34D6666C0a69C9504310aebd6fbdb8E699',
  },
  autoExecution: true,
  gasThreshold: 0.5,
  testnet: false,
  useXCallScanner: false,
  intentChainId: 'pol',
};

export const arbitrum: XChain = {
  id: 42161,
  name: 'Arbitrum',
  xChainId: '0xa4b1.arbitrum',
  xChainType: 'EVM',
  tracker: { tx: 'https://arbiscan.io/tx' },
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpc: {
    http: 'https://arb1.arbitrum.io/rpc',
  },
  contracts: {
    xCall: '0xfC83a3F252090B26f92F91DFB9dC3Eb710AdAf1b',
    assetManager: '0x78b7CD9308287DEb724527d8703c889e2d6C3708',
    bnUSD: '0xA67f4b09Eed22f8201Ee0637CbE9d654E63F946e',
  },
  autoExecution: true,
  gasThreshold: 0.0001,
  testnet: false,
  useXCallScanner: false,
  intentChainId: 'arb',
};

export const base: XChain = {
  id: 8453,
  name: 'Base',
  xChainId: '0x2105.base',
  xChainType: 'EVM',
  tracker: { tx: 'https://basescan.org/tx' },
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpc: {
    http: 'https://mainnet.base.org',
  },
  contracts: {
    xCall: '0x7fdde482956770D148E055f9d2893f84a1B6B00B',
    assetManager: '0xDccd213951D8214fBACa720728474E2cEf9d247B',
    bnUSD: '0x78b7CD9308287DEb724527d8703c889e2d6C3708',
  },
  autoExecution: true,
  gasThreshold: 0.0001,
  testnet: false,
  useXCallScanner: false,
};

export const injective: XChain = {
  id: 'injective-1',
  name: 'Injective',
  xChainId: 'injective-1',
  xChainType: 'INJECTIVE',
  tracker: { tx: 'https://explorer.injective.network/transaction' },
  nativeCurrency: {
    decimals: 18,
    name: 'INJ',
    symbol: 'INJ',
  },
  rpc: {
    http: 'https://sentry.tm.injective.network',
  },
  contracts: {
    xCall: 'inj177fx40l0g3jqmtmmuyl2zhrjvhr3knvthlr0ul',
    assetManager: 'inj1hayj9xnlh44sn29sgggn3jwl3ktl6djwcven25',
    bnUSD: 'inj1qspaxnztkkzahvp6scq6xfpgafejmj2td83r9j',
  },
  autoExecution: true,
  gasThreshold: 0.01,
  testnet: false,
  useXCallScanner: false,
};

export const stellar: XChain = {
  id: 'stellar',
  name: 'Stellar',
  xChainId: 'stellar',
  xChainType: 'STELLAR',
  tracker: { tx: 'https://stellar.expert/explorer/public/tx' },
  nativeCurrency: {
    decimals: 7,
    name: 'XLM',
    symbol: 'XLM',
  },
  rpc: {
    http: 'https://horizon.stellar.org',
  },
  contracts: {
    xCall: 'CB6IJRLOWGQXUDSYGFOAAZYVOESQ6TVSTU3242I7PG3LH7F43PPX2HE6',
    assetManager: 'CAGP34E2VHGO7Y3NEJHCMVFMTTTIYCGBWUH7FTCMHMVYAMQBIILX5GXH',
    bnUSD: 'CCT4ZYIYZ3TUO2AWQFEOFGBZ6HQP3GW5TA37CK7CRZVFRDXYTHTYX7KP',
  },
  autoExecution: true,
  gasThreshold: 3, // xCall fee: 0.1 XLM, threshold is higher because of the asset trustline and priority fees
  testnet: false,
  intentChainId: 'stellar',
  useXCallScanner: true,
};

// TODO: complete SUI chain
export const sui: XChain = {
  id: 'sui',
  name: 'Sui',
  xChainId: 'sui',
  xChainType: 'SUI',
  tracker: { tx: 'https://suiscan.xyz/mainnet/tx' },
  nativeCurrency: {
    decimals: 9,
    name: 'SUI',
    symbol: 'SUI',
  },
  rpc: {
    http: 'https://sentry.tm.sui.network',
  },
  contracts: {
    xCall: '0x3638b141b349173a97261bbfa33ccd45334d41a80584db6f30429e18736206fe', // TODO: not being used, just empty string
    assetManager: '0x1c1795e30fbc0b9c18543527940446e7601f5a3ca4db9830da4f3c68557e1fb3', // TODO: not being used, just empty string
    bnUSD: '0x03917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR',
  },
  autoExecution: true,
  gasThreshold: 0.15, // xCall fee: 0.05 SUI
  testnet: false,
  useXCallScanner: true,
  intentChainId: 'sui',
};

// TODO: complete solana chain
export const solana: XChain = {
  id: 'solana',
  name: 'Solana',
  xChainId: 'solana',
  xChainType: 'SOLANA',
  tracker: { tx: 'https://solscan.io/tx' },
  nativeCurrency: {
    decimals: 9,
    name: 'SOL',
    symbol: 'SOL',
  },
  rpc: {
    http: 'https://sentry.tm.solana.network',
  },
  contracts: {
    xCall: '3LWnGCRFuS4TJ5WeDKeWdoSRptB2tzeEFhSBFFu4ogMo',
    assetManager: '4u979CPSHUeJQbCYUAvoki4CQHDiG1257vt2DaJULPV9',
    bnUSD: '3JfaNQh3zRyBQ3spQJJWKmgRcXuQrcNrpLH5pDvaX2gG',
    xCallManager: 'Ganbqm2tJ8SuaN6kSRWsJhXGb7aLCvHLuCySxCfkXPVL',
  },
  autoExecution: true,
  gasThreshold: 0.01, // xCall fee: 0.0006 SOL
  testnet: false,
  useXCallScanner: true,
};

export const optimism: XChain = {
  id: 10,
  name: 'Optimism',
  xChainId: '0xa.optimism',
  xChainType: 'EVM',
  tracker: { tx: 'https://optimistic.etherscan.io/tx' },
  nativeCurrency: {
    decimals: 18,
    name: 'ETH',
    symbol: 'ETH',
  },
  rpc: {
    http: 'https://mainnet.optimism.io',
  },
  contracts: {
    xCall: '0xfC83a3F252090B26f92F91DFB9dC3Eb710AdAf1b',
    assetManager: '0xbcbd42Ab3c9d219b9c992Cc984DD2a77AfD95EF3',
    bnUSD: '0xdccd213951d8214fbaca720728474e2cef9d247b',
  },
  autoExecution: true,
  gasThreshold: 0.0001,
  testnet: false,
  useXCallScanner: false,
};

// the order is important, using manual order to display in the UI
export const xChainMap: { [key in XChainId]: XChain } = {
  '0x1.icon': icon,
  '0x2.icon': lisbon,
  archway: archwayTestnet,
  'archway-1': archway,
  '0xa4b1.arbitrum': arbitrum,
  '0xa86a.avax': avalanche,
  '0x100.icon': havah,
  '0xa869.fuji': fuji,
  '0x38.bsc': bsc,
  '0x2105.base': base,
  '0xa.optimism': optimism,
  '0x89.polygon': polygon,
  'injective-1': injective,
  stellar: stellar,
  sui: sui,
  solana: solana,
};

export const xChains = Object.values(xChainMap).filter(xChain => !xChain.testnet);
export const SUPPORTED_XCALL_CHAINS = xChains.map(({ xChainId }) => xChainId);

// you can the following values by calling getProtocols function of the XCallManager contract on ICON
/** from other chain to icon sources */
// destinations
export const FROM_SOURCES: { [key in XChainId]?: string[] } = {
  '0x2105.base': ['0x2f284b01F22369c82Cbd9804dC6Ea06afB55Be02'],
  '0xa4b1.arbitrum': ['0x133E6B7e7E10cD3Fc68eF84EdD9622b3e39C3812'],
  '0xa.optimism': ['0x133E6B7e7E10cD3Fc68eF84EdD9622b3e39C3812'],
  '0x38.bsc': ['0x20b056e975EEB8Ad4552FAD829F7990dE45d23D5'],
  '0xa86a.avax': ['0xF97301fA60C34E1EE73174e1cE9b71bFB9dfcDC9'],
  '0x100.icon': ['cxcf2c8d58fd7bbd25866de0660b155f057ea489eb'],
  'injective-1': ['inj1s5kcc96d5yahlngr9tjcvdtwlyen4675u7arka'],
  stellar: ['CCKGRRTF33TWSYKGX4SDQ2BLPSPRQ3WVXBQS3YEEXQJP52OAUQAWN3ML'],
  sui: ['cluster-conn'],
  solana: ['FMPY4m3kZNvFyoAtc87dCPkPrfJuLFpWyS8sbsWFkGC9'],
  '0x89.polygon': ['0x133E6B7e7E10cD3Fc68eF84EdD9622b3e39C3812'],
  'archway-1': [],
};

/** to other chain from icon sources */
// sources
export const TO_SOURCES: { [key in XChainId]?: string[] } = {
  '0x2105.base': ['cxdbfb9d63e84e6ad6ab301a2f2ef6b6e6e9227cbe'],
  '0xa4b1.arbitrum': ['cxdbfb9d63e84e6ad6ab301a2f2ef6b6e6e9227cbe'],
  '0xa.optimism': ['cxdbfb9d63e84e6ad6ab301a2f2ef6b6e6e9227cbe'],
  '0x38.bsc': ['cxdbfb9d63e84e6ad6ab301a2f2ef6b6e6e9227cbe'],
  '0xa86a.avax': ['cxdbfb9d63e84e6ad6ab301a2f2ef6b6e6e9227cbe'],
  '0x100.icon': ['cxee7a00755a757e3c519a0616456030e33dc9d47f'],
  'injective-1': ['cxdbfb9d63e84e6ad6ab301a2f2ef6b6e6e9227cbe'],
  stellar: ['cxdbfb9d63e84e6ad6ab301a2f2ef6b6e6e9227cbe'],
  sui: ['cxdbfb9d63e84e6ad6ab301a2f2ef6b6e6e9227cbe'],
  solana: ['cxdbfb9d63e84e6ad6ab301a2f2ef6b6e6e9227cbe'],
  '0x89.polygon': ['cxdbfb9d63e84e6ad6ab301a2f2ef6b6e6e9227cbe'],
  'archway-1': [],
};
