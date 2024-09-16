import { XChain, XChainId } from '@/xwagmi/types';

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
  gasThreshold: 2,
  testnet: false,
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
  gasThreshold: 10,
  testnet: true,
};

export const icon: XChain = {
  id: 1,
  name: 'ICON',
  xChainId: '0x1.icon',
  xChainType: 'ICON',
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
  gasThreshold: 2.5,
  testnet: false,
};

export const lisbon: XChain = {
  id: 2,
  name: 'Lisbon Testnet',
  xChainId: '0x2.icon',
  xChainType: 'ICON',
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
  testnet: true,
};

export const avalanche: XChain = {
  id: 43_114,
  name: 'Avalanche',
  xChainId: '0xa86a.avax',
  xChainType: 'EVM',
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
  gasThreshold: 0.05,
  testnet: false,
};

export const fuji: XChain = {
  id: 43_113,
  name: 'Fuji Testnet',
  xChainId: '0xa869.fuji',
  xChainType: 'EVM',
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
  testnet: true,
};

export const havah: XChain = {
  id: 'havah',
  name: 'Havah',
  xChainId: '0x100.icon',
  xChainType: 'HAVAH',
  tracker: 'https://scan.havah.io',
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
};

export const bsc: XChain = {
  id: 56,
  name: 'BNB Chain',
  xChainId: '0x38.bsc',
  xChainType: 'EVM',
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
    xCall: '0xfc83a3f252090b26f92f91dfb9dc3eb710adaf1b',
    assetManager: '0x69e81Cea7889608A63947814893ad1B86DcC03Aa',
    bnUSD: '0xc65132325bD4FcF2Ec5F3a9375487163B6999206',
  },
  autoExecution: true,
  gasThreshold: 0.005,
  testnet: false,
};

export const arbitrum: XChain = {
  id: 42161,
  name: 'Arbitrum',
  xChainId: '0xa4b1.arbitrum',
  xChainType: 'EVM',
  tracker: 'https://arbiscan.io/',
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
};

export const base: XChain = {
  id: 8453,
  name: 'Base',
  xChainId: '0x2105.base',
  xChainType: 'EVM',
  tracker: 'https://basescan.org/',
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
};

export const injective: XChain = {
  id: 'injective-1',
  name: 'Injective',
  xChainId: 'injective-1',
  xChainType: 'INJECTIVE',
  tracker: 'https://explorer.injective.network/',
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
};

export const stellar: XChain = {
  id: 'stellar',
  name: 'Stellar',
  xChainId: 'stellar',
  xChainType: 'STELLAR',
  tracker: 'https://stellar.expert/explorer/public/',
  nativeCurrency: {
    decimals: 7,
    name: 'XLM',
    symbol: 'XLM',
  },
  rpc: {
    http: 'https://horizon.stellar.org',
  },
  contracts: {
    xCall: 'xlm..todo..',
    assetManager: 'xlm..todo..',
    bnUSD: 'xlm..todo..',
  },
  autoExecution: true,
  gasThreshold: 0.5,
  testnet: false,
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
  'injective-1': injective,
  stellar: stellar,
};

export const xChains = Object.values(xChainMap).filter(xChain => !xChain.testnet);
export const SUPPORTED_XCALL_CHAINS = xChains.map(({ xChainId }) => xChainId);

/** from other chain to icon sources */
export const FROM_SOURCES: { [key in XChainId]?: string[] } = {
  '0x2105.base': ['0x8A47E036B9c4594dF95F2dbFA09fb475Fa75469d', '0x6185D52640EA3b683AedD8bA52d18053A41fee09'],
  '0xa4b1.arbitrum': ['0x4c6C68E8F5206EE4a1690C808cfF5c3fD35b512F', '0x1F8B1e9d3633229d38BDFc93dCa50B6453Ad8E97'],
  '0x38.bsc': ['0x24415977c566f9300Ea6F0aC75AEA0c09C500e46'],
  '0xa86a.avax': ['0xC1a39C4e7AA98DEC394eF54559960873Bd619cA3', '0x7F3665eF19258cD5cE15eA39d014F47Fc942AE0C'],
  '0x100.icon': ['cxcf2c8d58fd7bbd25866de0660b155f057ea489eb'],
  'injective-1': ['inj15jcde723hrm5f4fx3r2stnq59jykt2askud8ht'],
};

/** to other chain from icon sources */
export const TO_SOURCES: { [key in XChainId]?: string[] } = {
  '0x2105.base': ['cx91a5817cf6e7adbcbcee9e8815c63f83d9a98afc', 'cxdada6921d08fbf37c6f228816852e58b219cc589'],
  '0xa4b1.arbitrum': ['cx91a5817cf6e7adbcbcee9e8815c63f83d9a98afc', 'cxdada6921d08fbf37c6f228816852e58b219cc589'],
  '0x38.bsc': ['cxee7a00755a757e3c519a0616456030e33dc9d47f'],
  '0xa86a.avax': ['cx59d899fce52cadd1feb5128ff5e6672f03943eec', 'cx917f88460d4ebec1fd656d4dbe51131a37d16837'],
  '0x100.icon': ['cxee7a00755a757e3c519a0616456030e33dc9d47f'],
  'injective-1': ['cx6f86ed848f9f0d03ba1220811d95d864c72da88c'],
};
