import { SupportedChainId as ChainId, addresses } from '@balancednetwork/balanced-js';
import { XChainId, XToken } from '@balancednetwork/sdk-core';

export const DEFAULT_TOKEN_CHAIN: { [key in string]: XChainId } = {
  bnUSD: '0x1.icon',
  sARCH: 'archway-1',
  AVAX: '0xa86a.avax',
  BNB: '0x38.bsc',
  ETH: '0xa4b1.arbitrum',
  BTC: '0xa4b1.arbitrum',
  INJ: 'injective-1',
  HVH: '0x100.icon',
  USDT: '0xa4b1.arbitrum',
  USDC: '0xa86a.avax',
  hyTB: '0xa86a.avax',
};

export const allXTokens: XToken[] = [
  // 0x1.icon
  new XToken('0x1.icon', ChainId.MAINNET, '0x1.icon-native', 18, 'ICX', 'ICX'),
  new XToken('0x1.icon', ChainId.MAINNET, addresses[ChainId.MAINNET].bnusd, 18, 'bnUSD', 'Balanced Dollar'),
  new XToken('0x1.icon', ChainId.MAINNET, 'cxfe94530ee0d159db3e5b7dcffbcd0dfb360075c0', 18, 'sARCH', 'Staked Archway'),
  new XToken('0x1.icon', ChainId.MAINNET, 'cx22319ac7f412f53eabe3c9827acf5e27e9c6a95f', 6, 'USDC', 'Archway USDC'),
  new XToken('0x1.icon', ChainId.MAINNET, 'cx66a031cc3bd305c76371fb586e93801b948254f0', 18, 'AVAX', 'AVAX'),
  new XToken(
    '0x1.icon',
    ChainId.MAINNET,
    'cxf0a30d09ade391d7b570908b9b46cfa5b3cbc8f8',
    18,
    'hyTB',
    'HiYield Treasury Bill',
  ),
  new XToken('0x1.icon', ChainId.MAINNET, 'cx2d552c485ec8bcaa75aac02424e2aca6ffdb2f1b', 18, 'BNB', 'BNB'),
  new XToken('0x1.icon', ChainId.MAINNET, 'cx288d13e1b63563459a2ac6179f237711f6851cb5', 18, 'ETH', 'ETH'),
  new XToken('0x1.icon', ChainId.MAINNET, 'cxe2da9f10bc6e2754347bde2ef73379bd398fd9f3', 18, 'HVH', 'HVH'),
  new XToken('0x1.icon', ChainId.MAINNET, 'cx07b184a37f03c6ab681fcbd0b45aec6dc3eafbeb', 18, 'BTC', 'Bitcoin', 'BTC1'),
  new XToken('0x1.icon', ChainId.MAINNET, 'cx4297f4b63262507623b6ad575d0d8dd2db980e4e', 18, 'INJ', 'INJ'),
  new XToken('0x1.icon', ChainId.MAINNET, 'cx16f3cb9f09f5cdd902cf07aa752c8b3bd1bc9609', 6, 'USDT', 'Tether USD'),
  new XToken('0x1.icon', ChainId.MAINNET, 'cx508002ec116fbf3ab406329c0df28e70d7e75fb3', 9, 'SUI', 'SUI'),

  //  archway-1
  new XToken('archway-1', 'archway-1', 'archway-1-native', 18, 'aARCH', 'Arch'),
  new XToken(
    'archway-1',
    'archway-1',
    'archway1l3m84nf7xagkdrcced2y0g367xphnea5uqc3mww3f83eh6h38nqqxnsxz7',
    18,
    'bnUSD',
    'Balanced Dollar',
  ),
  new XToken(
    'archway-1',
    'archway-1',
    'archway1t2llqsvwwunf98v692nqd5juudcmmlu3zk55utx7xtfvznel030saclvq6',
    18,
    'sARCH',
    'Staked Arch',
  ),
  new XToken(
    'archway-1',
    'archway-1',
    'ibc/43897B9739BD63E3A08A88191999C632E052724AB96BD4C74AE31375C991F48D',
    6,
    'USDC',
    'USDC on Archway',
  ),

  // '0xa86a.avax': [
  new XToken('0xa86a.avax', 43114, '0xa86a.avax-native', 18, 'AVAX', 'AVAX'),
  new XToken('0xa86a.avax', 43114, '0x8475509d391e6ee5A8b7133221CE17019D307B3E', 18, 'hyTB', 'HiYield Treasury Bill'),
  new XToken('0xa86a.avax', 43114, '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6, 'USDC', 'USD Coin'),
  new XToken('0xa86a.avax', 43114, '0xdBDd50997361522495EcFE57EBb6850dA0E4C699', 18, 'bnUSD', 'Balanced Dollar'),
  new XToken('0xa86a.avax', 43114, '0x9702230A8Ea53601f5cD2dc00fDBc13d4dF4A8c7', 6, 'USDT', 'Tether USD'),

  // '0x38.bsc': [
  new XToken('0x38.bsc', 56, '0x38.bsc-native', 18, 'BNB', 'BNB'),
  new XToken('0x38.bsc', 56, '0x2170Ed0880ac9A755fd29B2688956BD959F933F8', 18, 'ETH', 'Ethereum'),
  new XToken('0x38.bsc', 56, '0xc65132325bD4FcF2Ec5F3a9375487163B6999206', 18, 'bnUSD', 'Balanced Dollar'),
  new XToken('0x38.bsc', 56, '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c', 18, 'BTC', 'Binance-Peg BTCB Token', 'BTC1'),

  // '0xa4b1.arbitrum': [
  new XToken('0xa4b1.arbitrum', 42161, '0xa4b1.arbitrum-native', 18, 'ETH', 'ETH'),
  new XToken('0xa4b1.arbitrum', 42161, '0xA67f4b09Eed22f8201Ee0637CbE9d654E63F946e', 18, 'bnUSD', 'Balanced Dollar'),
  new XToken('0xa4b1.arbitrum', 42161, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', 6, 'USDC', 'USD Coin'),
  new XToken('0xa4b1.arbitrum', 42161, '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f', 8, 'BTC', 'Wrapped BTC', 'BTC1'),
  new XToken('0xa4b1.arbitrum', 42161, '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', 6, 'USDT', 'Tether USD'),

  // '0x2105.base': [
  new XToken('0x2105.base', 8453, '0x2105.base-native', 18, 'ETH', 'ETH'),
  new XToken('0x2105.base', 8453, '0x78b7CD9308287DEb724527d8703c889e2d6C3708', 18, 'bnUSD', 'Balanced Dollar'),
  new XToken('0x2105.base', 8453, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', 6, 'USDC', 'USD Coin'),

  // '0x100.icon': [
  new XToken('0x100.icon', 0x100, '0x100.icon-native', 18, 'HVH', 'HVH'),
  new XToken('0x100.icon', 0x100, 'cx4b40466250f9ccf04cc92da1b6633968ba3ec7cc', 18, 'bnUSD', 'Balanced Dollar'),

  // 'injective-1': [
  new XToken('injective-1', 'injective-1', 'injective-1-native', 18, 'INJ', 'INJ'),
  new XToken(
    'injective-1',
    'injective-1',
    'inj1qspaxnztkkzahvp6scq6xfpgafejmj2td83r9j',
    18,
    'bnUSD',
    'Balanced Dollar',
  ),
  new XToken(
    'injective-1',
    'injective-1',
    'ibc/2CBC2EA121AE42563B08028466F37B600F2D7D4282342DE938283CC3FB2BC00E',
    6,
    'USDC',
    'USD Coin',
  ),

  // sui: [
  new XToken('sui', 'sui', 'sui-native', 9, 'SUI', 'SUI'),
  new XToken(
    'sui',
    'sui',
    '0x03917a812fe4a6d6bc779c5ab53f8a80ba741f8af04121193fc44e0f662e2ceb::balanced_dollar::BALANCED_DOLLAR',
    9,
    'bnUSD',
    'Balanced Dollar',
  ),
];

export const xTokenMap: { [addr: string]: XToken } = allXTokens.reduce((map, xToken) => {
  map[xToken.address] = xToken;
  return map;
}, {});

export const sARCHOnArchway = {
  ['archway-1']: new XToken(
    'archway-1',
    'archway-1',
    'archway1t2llqsvwwunf98v692nqd5juudcmmlu3zk55utx7xtfvznel030saclvq6',
    18,
    'sARCH',
    'Staked Archway',
  ),
  ['archway']: new XToken(
    'archway',
    'archway',
    'archway1erqguqc3hmfajgu7e2dvgaccx6feu5ru3gyatdxu94p66j9hp7msn2kcqp',
    18,
    'sARCH',
    'Staked Archway',
  ),
};
