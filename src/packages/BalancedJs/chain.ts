export enum SupportedChainId {
  MAINNET = 1,
  YEOUIDO = 3,
  SEJONG = 83,
  BERLIN = 7,
}

export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = [
  SupportedChainId.MAINNET, //
  SupportedChainId.YEOUIDO,
  SupportedChainId.SEJONG,
  SupportedChainId.BERLIN,
];

interface ChainInfo {
  readonly name: string;
  readonly node: string;
  readonly APIEndpoint: string;
  readonly debugAPIEndpoint: string;
  readonly chainId: number;
  readonly tracker: string;
}

export const CHAIN_INFO: { readonly [chainId: number]: ChainInfo } = {
  [SupportedChainId.MAINNET]: {
    name: 'ICON Mainnet',
    node: 'https://ctz.solidwallet.io',
    APIEndpoint: 'https://ctz.solidwallet.io/api/v3',
    debugAPIEndpoint: 'https://ctz.solidwallet.io/api/debug/v3',
    chainId: 1,
    tracker: 'https://tracker.icon.foundation',
  },
  [SupportedChainId.YEOUIDO]: {
    name: 'Yeouido',
    node: 'https://bicon.net.solidwallet.io',
    APIEndpoint: 'https://bicon.net.solidwallet.io/api/v3',
    debugAPIEndpoint: 'https://bicon.net.solidwallet.io/api/debug/v3',
    chainId: 3,
    tracker: 'https://bicon.tracker.solidwallet.io',
  },
  [SupportedChainId.SEJONG]: {
    name: 'Sejong',
    node: 'https://sejong.net.solidwallet.io',
    APIEndpoint: 'https://sejong.net.solidwallet.io/api/v3',
    debugAPIEndpoint: 'https://sejong.net.solidwallet.io/api/v3d',
    chainId: 83,
    tracker: 'https://sejong.tracker.solidwallet.io',
  },
  [SupportedChainId.BERLIN]: {
    name: 'Berlin',
    node: 'https://berlin.net.solidwallet.io',
    APIEndpoint: 'https://berlin.net.solidwallet.io/api/v3',
    debugAPIEndpoint: 'https://berlin.net.solidwallet.io/api/v3d',
    chainId: 7,
    tracker: 'https://berlin.tracker.solidwallet.io',
  },
};
