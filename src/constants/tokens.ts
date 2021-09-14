import { Token } from 'types/balanced-sdk-core/index';

import { SupportedChainId } from './chains';

export const ICX = new Token(SupportedChainId.MAINNET, 'cx0000000000000000000000000000000000000000', 18, 'ICX', 'ICX');
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
  SupportedChainId.MAINNET, //
  'cxae3034235540b924dfcc1b45836c293dcc82bfb7',
  6,
  'IUSDC',
  'IUSDC',
);
export const USDS = new Token(
  SupportedChainId.MAINNET, //
  'cxbb2871f468a3008f80b08fdde5b8b951583acf06',
  18,
  'USDS',
  'USDS',
);
export const OMM = new Token(SupportedChainId.MAINNET, 'cx1a29259a59f463a67bb2ef84398b30ca56b5830a', 18, 'OMM', 'OMM');

// yeouido
export const ICX_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cx0000000000000000000000000000000000000000',
  18,
  'ICX',
  'ICX',
);
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
  SupportedChainId.YEOUIDO, //
  'cx65f639254090820361da483df233f6d0e69af9b7',
  6,
  'IUSDC',
  'IUSDC',
);
export const USDS_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO, //
  'cxc0666df567a6e0b49342648e98ccbe5362b264ea',
  18,
  'USDS',
  'USDS',
);

export const OMM_YEOUIDO = new Token(
  SupportedChainId.YEOUIDO,
  'cx1a29259a59f463a67bb2ef84398b30ca56b5830a',
  18,
  'OMM',
  'OMM',
);

// todo: calculate supported tokens from supported tokens info
export const SUPPORTED_TOKENS: { [chainId: number]: Token[] } = {
  [SupportedChainId.MAINNET]: [ICX, sICX, bnUSD, BALN, IUSDC, OMM, USDS],
  [SupportedChainId.YEOUIDO]: [
    ICX_YEOUIDO,
    sICX_YEOUIDO,
    bnUSD_YEOUIDO,
    BALN_YEOUIDO,
    IUSDC_YEOUIDO,
    USDS_YEOUIDO,
    OMM_YEOUIDO,
  ],
};

export interface TokenInfo {
  readonly chainId: number;
  readonly address: string;
  readonly name: string;
  readonly decimals: number;
  readonly symbol: string;
  readonly logoURI?: string;
  readonly tags?: string[];
  readonly extensions?: {
    readonly [key: string]: string | number | boolean | null;
  };
}

// this information contains the tokens the balanced supports
// eventually this information will saved in json file.
// the logo url are wrong. need to change

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
    address: 'cx05515d126a47a98c682fa86992329e6c2ec70503',
    symbol: 'OMM',
    decimals: 18,
    chainId: 3,
    logoURI:
      'https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets/0x4922a015c4407F87432B179bb209e125432E4a2A/logo.png',
  },
];
