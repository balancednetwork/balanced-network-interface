import { SupportedXCallChains, XChain } from '../types';

export const archway: XChain = {
  id: 'archway-1',
  name: 'archway',
  network: '',
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

export const icon: XChain = {
  id: 1,
  name: 'icon',
  network: '',
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

export const avalanche: XChain = {
  id: 43_114,
  name: 'Avalanche',
  network: '',
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
    xCall: '0xDccd213951D8214fBACa720728474E2cEf9d247B',
    assetManager: '0xdf851B4f0D9b2323e03B3980b1C4Cf56273c0bd9',
    bnUSD: '0xdBDd50997361522495EcFE57EBb6850dA0E4C699',
  },
  autoExecution: true,
  gasThreshold: 0,
};

export const xChains: { [key in SupportedXCallChains]: XChain } = {
  ['archway']: archway,
  ['icon']: icon,
  // ['avax']: avalanche,
};
