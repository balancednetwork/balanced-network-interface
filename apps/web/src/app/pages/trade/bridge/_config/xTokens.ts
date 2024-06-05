import { XChainId, XToken } from '../types';

export const DEFAULT_TOKEN_CHAIN: { [key in string]: XChainId } = {
  bnUSD: '0x1.icon',
  sARCH: 'archway-1',
  AVAX: '0xa86a.avax',
};

import { bnUSD } from 'constants/tokens';

import { SupportedChainId as ChainId } from '@balancednetwork/balanced-js';
import { sARCH } from './tokens';
import { NATIVE_ADDRESS } from 'constants/index';

export const xTokenMap: { [key in XChainId]: XToken[] } = {
  '0x1.icon': [
    XToken.getXToken('0x1.icon', bnUSD[ChainId.MAINNET]),
    XToken.getXToken('0x1.icon', sARCH[ChainId.MAINNET]),
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
    new XToken('0x1.icon', ChainId.MAINNET, 'cx5b5a03cb525a1845d0af3a872d525b18a810acb0', 18, 'BTCB', 'Binance BTC'),
  ],
  'archway-1': [
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
  ],
  '0xa86a.avax': [
    new XToken('0xa86a.avax', 43114, NATIVE_ADDRESS, 18, 'AVAX', 'AVAX'),
    new XToken('0xa86a.avax', 43114, '0x8475509d391e6ee5A8b7133221CE17019D307B3E', 18, 'hyTB', 'HiYield Treasury Bill'),
    new XToken('0xa86a.avax', 43114, '0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E', 6, 'USDC', 'USD Coin'),
    new XToken('0xa86a.avax', 43114, '0xdBDd50997361522495EcFE57EBb6850dA0E4C699', 18, 'bnUSD', 'Balanced Dollar'),
  ],
  '0x38.bsc': [
    new XToken('0x38.bsc', 56, NATIVE_ADDRESS, 18, 'BNB', 'BNB'),
    new XToken('0x38.bsc', 56, '0x7130d2a12b9bcbfae4f2634d864a1ee1ce3ead9c', 18, 'BTCB', 'Binance BTC'),
    new XToken('0x38.bsc', 56, '0x2170ed0880ac9a755fd29b2688956bd959f933f8', 18, 'ETH', 'Ethereum'),
    new XToken('0x38.bsc', 56, '0xc65132325bD4FcF2Ec5F3a9375487163B6999206', 18, 'bnUSD', 'Balanced Dollar'),
  ],
  '0xa4b1.arbitrum': [
    new XToken('0xa4b1.arbitrum', 42161, NATIVE_ADDRESS, 18, 'ETH', 'ETH'),
    new XToken('0xa4b1.arbitrum', 42161, '0xA67f4b09Eed22f8201Ee0637CbE9d654E63F946e', 18, 'bnUSD', 'Balanced Dollar'),
  ],
  '0x2.icon': [],
  '0xa869.fuji': [],
  archway: [],
};
