import { SupportedChainId } from '@balancednetwork/balanced-js';
import { Currency, Token } from '@balancednetwork/sdk-core';

import { NETWORK_ID } from './config';

export const NULL_CONTRACT_ADDRESS = 'cx0000000000000000000000000000000000000000';

export const isNativeCurrency = (token?: Currency): boolean => {
  return (
    token instanceof Token &&
    (token.address === ICX.address || token.address === ICX_YEOUIDO.address || token.address === ICX_SEJONG.address)
  );
};

export const isBALN = (token?: Currency): boolean => {
  return (
    token instanceof Token &&
    (token.address === BALN.address || token.address === BALN_YEOUIDO.address || token.address === BALN_SEJONG.address)
  );
};

export const isFIN = (token?: Currency): boolean => {
  return token instanceof Token && (token.address === FIN.address || token.address === FIN_SEJONG.address);
};

export const ICX = new Token(SupportedChainId.MAINNET, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX');
export const sICX = new Token(
  SupportedChainId.MAINNET,
  'cx2609b924e33ef00b648a409245c7ea394c467824',
  18,
  'sICX',
  'Staked ICX',
);
export const bnUSD = new Token(
  SupportedChainId.MAINNET,
  'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
  18,
  'bnUSD',
  'Balanced Dollar',
);
export const BALN = new Token(
  SupportedChainId.MAINNET,
  'cxf61cd5a45dc9f91c15aa65831a30a90d59a09619',
  18,
  'BALN',
  'Balance Token',
);
export const IUSDC = new Token(
  SupportedChainId.MAINNET,
  'cxae3034235540b924dfcc1b45836c293dcc82bfb7',
  6,
  'IUSDC',
  'ICON USD Coin',
);
export const USDS = new Token(
  SupportedChainId.MAINNET,
  'cxbb2871f468a3008f80b08fdde5b8b951583acf06',
  18,
  'USDS',
  'Stably USD',
);
export const OMM = new Token(
  SupportedChainId.MAINNET,
  'cx1a29259a59f463a67bb2ef84398b30ca56b5830a',
  18,
  'OMM',
  'Omm Token',
);
export const CFT = new Token(
  SupportedChainId.MAINNET,
  'cx2e6d0fc0eca04965d06038c8406093337f085fcf',
  18,
  'CFT',
  'Craft',
);
export const IUSDT = new Token(
  SupportedChainId.MAINNET,
  'cx3a36ea1f6b9aa3d2dd9cb68e8987bcc3aabaaa88',
  6,
  'IUSDT',
  'ICON Tether',
);
export const GBET = new Token(
  SupportedChainId.MAINNET,
  'cx6139a27c15f1653471ffba0b4b88dc15de7e3267',
  18,
  'GBET',
  'GangstaBet Token',
);
export const FIN = new Token(
  SupportedChainId.MAINNET,
  'cx785d504f44b5d2c8dac04c5a1ecd75f18ee57d16',
  18,
  'FIN',
  'Fin Token',
);
export const BUSD = new Token(
  SupportedChainId.MAINNET,
  'cxb49d82c46be6b61cab62aaf9824b597c6cf8a25d',
  18,
  'BUSD',
  'Binance USD',
);

// yeouido
export const ICX_YEOUIDO = new Token(SupportedChainId.YEOUIDO, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX');
export const sICX_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cxae6334850f13dfd8b50f8544d5acb126bb8ef82d',
  18,
  'sICX',
  'Staked ICX',
);
export const bnUSD_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cxc48c9c81ceef04445c961c5cc8ff056d733dfe3a',
  18,
  'bnUSD',
  'Balanced Dollar',
);
export const BALN_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cx36169736b39f59bf19e8950f6c8fa4bfa18b710a',
  18,
  'BALN',
  'Balance Token',
);
export const IUSDC_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cx65f639254090820361da483df233f6d0e69af9b7',
  6,
  'IUSDC',
  'ICON USD Coin',
);
export const USDS_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cxc0666df567a6e0b49342648e98ccbe5362b264ea',
  18,
  'USDS',
  'Stably USD',
);

export const OMM_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cxc58f32a437c8e5a5fcb8129626662f2252ad2678',
  18,
  'OMM',
  'Omm Token',
);

export const CFT_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cxf7313d7fd611c99b8db29e298699be4b1fd86661',
  18,
  'CFT',
  'Craft',
);

// sejong
export const ICX_SEJONG = new Token(SupportedChainId.SEJONG, NULL_CONTRACT_ADDRESS, 18, 'ICX', 'ICX');
export const sICX_SEJONG = new Token(
  SupportedChainId.SEJONG,
  'cx70806fdfa274fe12ab61f1f98c5a7a1409a0c108',
  18,
  'sICX',
  'Staked ICX',
);
export const bnUSD_SEJONG = new Token(
  SupportedChainId.SEJONG,
  'cx5838cb516d6156a060f90e9a3de92381331ff024',
  18,
  'bnUSD',
  'Balanced Dollar',
);
export const BALN_SEJONG = new Token(
  SupportedChainId.SEJONG,
  'cx303470dbc10e5b4ab8831a61dbe00f75db10c38b',
  18,
  'BALN',
  'Balance Token',
);
export const IUSDC_SEJONG = new Token(
  SupportedChainId.SEJONG,
  'cxb2c075e9130440dd64e6bfd3fe09e5c629f6e183',
  6,
  'IUSDC',
  'ICON USD Coin',
);
export const FIN_SEJONG = new Token(
  SupportedChainId.SEJONG,
  'cx0d0c689da98fd4ca66a5695fd8581648def604eb',
  18,
  'FIN',
  'Fin Token',
);

export const USDC = new Token(
  SupportedChainId.MAINNET,
  'cx22319ac7f412f53eabe3c9827acf5e27e9c6a95f',
  6,
  'USDC',
  'USDC',
);

export const USDT = new Token(
  SupportedChainId.MAINNET,
  'cx16f3cb9f09f5cdd902cf07aa752c8b3bd1bc9609',
  6,
  'USDT',
  'Tether USD',
);

export const hyTB = new Token(
  SupportedChainId.MAINNET,
  'cxf0a30d09ade391d7b570908b9b46cfa5b3cbc8f8',
  18,
  'hyTB',
  'HiYield Treasury Bill',
);

export const BTCB = new Token(
  SupportedChainId.MAINNET,
  'cx5b5a03cb525a1845d0af3a872d525b18a810acb0',
  18,
  'BTCB',
  'Binance Bitcoin',
);

export const ETH = new Token(
  SupportedChainId.MAINNET,
  'cx288d13e1b63563459a2ac6179f237711f6851cb5',
  18,
  'ETH',
  'Ethereum',
);

export const BNB = new Token(SupportedChainId.MAINNET, 'cx2d552c485ec8bcaa75aac02424e2aca6ffdb2f1b', 18, 'BNB', 'BNB');
export const AVAX = new Token(
  SupportedChainId.MAINNET,
  'cx66a031cc3bd305c76371fb586e93801b948254f0',
  18,
  'AVAX',
  'Avalanche',
);
export const INJ = new Token(
  SupportedChainId.MAINNET,
  'cx4297f4b63262507623b6ad575d0d8dd2db980e4e',
  18,
  'INJ',
  'Injective',
);

export const BTC = new Token(
  SupportedChainId.MAINNET,
  'cx07b184a37f03c6ab681fcbd0b45aec6dc3eafbeb',
  18,
  'BTC',
  'Bitcoin',
);

export const HVH = new Token(
  SupportedChainId.MAINNET,
  'cxe2da9f10bc6e2754347bde2ef73379bd398fd9f3',
  18,
  'HVH',
  'HAVAH',
);

export const tBTC = new Token(
  SupportedChainId.MAINNET,
  'cx15ddac8c2663bd7e71ca1688dffa426070752fbd',
  18,
  'tBTC',
  'Threshold BTC',
);

export const weETH = new Token(
  SupportedChainId.MAINNET,
  'cxce7b23917ddf57656010decd6017fe5016de681b',
  18,
  'weETH',
  'Wrapped Ethereum',
);

export const wstETH = new Token(
  SupportedChainId.MAINNET,
  'cxb940dbfbc45c92f3a0cde464c4331102e7a84da8',
  18,
  'wstETH',
  'Wrapped stETH',
);

// todo: calculate supported tokens from supported tokens info
export const SUPPORTED_TOKENS: { [chainId: number]: Token[] } = {
  [SupportedChainId.MAINNET]: [
    ICX,
    BALN,
    bnUSD,
    sICX,
    IUSDC,
    USDS,
    OMM,
    USDS,
    IUSDT,
    CFT,
    GBET,
    FIN,
    BUSD,
    USDC,
    hyTB,
    BTCB,
    ETH,
    BNB,
    INJ,
    AVAX,
    BTC,
    HVH,
    USDT,
    tBTC,
    weETH,
    wstETH,
  ],
  [SupportedChainId.YEOUIDO]: [
    ICX_YEOUIDO,
    sICX_YEOUIDO,
    bnUSD_YEOUIDO,
    BALN_YEOUIDO,
    IUSDC_YEOUIDO,
    USDS_YEOUIDO,
    OMM_YEOUIDO,
    CFT_YEOUIDO,
  ],
  //[SupportedChainId.SEJONG]: [ICX_SEJONG, sICX_SEJONG, bnUSD_SEJONG, BALN_SEJONG, IUSDC_SEJONG],
  [SupportedChainId.SEJONG]: [ICX_SEJONG, sICX_SEJONG, bnUSD_SEJONG, BALN_SEJONG, FIN_SEJONG],
};

export const TOKENS_OMITTED_FROM_STATS = ['BUSD'];

export const SUPPORTED_TOKENS_LIST = SUPPORTED_TOKENS[NETWORK_ID];

export const SUPPORTED_TOKENS_MAP_BY_ADDRESS: {
  [key: string]: Token;
} = SUPPORTED_TOKENS_LIST.reduce((prev, cur) => {
  prev[cur.address] = cur;
  return prev;
}, {});

export const FUNDING_TOKENS: { [chainId: number]: Token[] } = {
  [SupportedChainId.MAINNET]: [sICX, bnUSD, BALN],
  [SupportedChainId.YEOUIDO]: [sICX_YEOUIDO, bnUSD_YEOUIDO, BALN_YEOUIDO],
  [SupportedChainId.SEJONG]: [sICX_SEJONG, bnUSD_SEJONG, BALN_SEJONG],
};

export const FUNDING_TOKENS_LIST = FUNDING_TOKENS[NETWORK_ID];

/*
 * this information contains the tokens the balanced supports
 * eventually this information will saved in json file.
 * the logo url are wrong. need to change
 */

export interface TokenInfo {
  readonly chainId: number;
  readonly address: string;
  readonly searchableTerms: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: {
    readonly [key: string]: string | number | boolean | null;
  };
}

/*
export const SUPPORTED_TOKENS_INFO: TokenInfo[] = [
  // Mainnet
  {
    name: 'Staked ICX',
    address: 'cx2609b924e33ef00b648a409245c7ea394c467824',
    symbol: 'sICX',
    decimals: 18,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
  {
    name: 'Balanced Dollar',
    address: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
    symbol: 'bnUSD',
    decimals: 18,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
  {
    name: 'Balance Token',
    address: 'cxf61cd5a45dc9f91c15aa65831a30a90d59a09619',
    symbol: 'BALN',
    decimals: 18,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
  {
    name: 'ICON USD Coin',
    address: 'cxae3034235540b924dfcc1b45836c293dcc82bfb7',
    symbol: 'IUSDC',
    decimals: 6,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
  {
    name: 'Stably USD',
    address: 'cxbb2871f468a3008f80b08fdde5b8b951583acf06',
    symbol: 'USDS',
    decimals: 18,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
  {
    name: 'Omm Token',
    address: 'cx1a29259a59f463a67bb2ef84398b30ca56b5830a',
    symbol: 'OMM',
    decimals: 18,
    chainId: 1,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },

  // yeouido
  {
    name: 'Staked ICX',
    address: 'cxae6334850f13dfd8b50f8544d5acb126bb8ef82d',
    symbol: 'sICX',
    decimals: 18,
    chainId: 3,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
  {
    name: 'Balanced Dollar',
    address: 'cxc48c9c81ceef04445c961c5cc8ff056d733dfe3a',
    symbol: 'bnUSD',
    decimals: 18,
    chainId: 3,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
  {
    name: 'Balance Token',
    address: 'cx36169736b39f59bf19e8950f6c8fa4bfa18b710a',
    symbol: 'BALN',
    decimals: 18,
    chainId: 3,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
  {
    name: 'ICON USD Coin',
    address: 'cx65f639254090820361da483df233f6d0e69af9b7',
    symbol: 'IUSDC',
    decimals: 6,
    chainId: 3,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
  {
    name: 'Stably USD',
    address: 'cxc0666df567a6e0b49342648e98ccbe5362b264ea',
    symbol: 'USDS',
    decimals: 18,
    chainId: 3,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
  {
    name: 'Omm Token',
    address: 'cxc58f32a437c8e5a5fcb8129626662f2252ad2678',
    symbol: 'OMM',
    decimals: 18,
    chainId: 3,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
];
*/

export const HIGH_PRICE_ASSET_DP: { [key in string]: number } = {
  cx07b184a37f03c6ab681fcbd0b45aec6dc3eafbeb: 6,
  cx99c79fd6dee53335f686c7f2cb513745622634f2: 5,
  cx288d13e1b63563459a2ac6179f237711f6851cb5: 5,
};

export const TOKEN_BLACKLIST = ['IUSDC', 'USDS', 'BUSD', 'BTCB', 'FIN', 'METX', 'FRMD'];
