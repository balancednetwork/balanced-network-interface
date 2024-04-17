export enum SupportedChainId {
  MAINNET = 1,
  YEOUIDO = 3,
  SEJONG = 83,
  BERLIN = 7,
  LISBON = 2,
}

export const ALL_SUPPORTED_CHAIN_IDS: SupportedChainId[] = [
  SupportedChainId.MAINNET, //
  SupportedChainId.YEOUIDO,
  SupportedChainId.SEJONG,
  SupportedChainId.BERLIN,
  SupportedChainId.LISBON,
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
    debugAPIEndpoint: 'https://api.icon.community/api/v3d',
    chainId: 1,
    tracker: 'https://tracker.icon.community',
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
    tracker: 'https://tracker.sejong.icon.community',
  },
  [SupportedChainId.BERLIN]: {
    name: 'Berlin',
    node: 'https://berlin.net.solidwallet.io',
    // APIEndpoint: 'https://berlin.net.solidwallet.io/api/v3',
    APIEndpoint: 'https://api.berlin.icon.community/api/v3',
    debugAPIEndpoint: 'https://berlin.net.solidwallet.io/api/v3d',
    chainId: 7,
    tracker: 'https://tracker.berlin.icon.community',
  },
  [SupportedChainId.LISBON]: {
    name: 'LISBON',
    node: 'https://lisbon.net.solidwallet.io',
    APIEndpoint: 'https://lisbon.net.solidwallet.io/api/v3',
    debugAPIEndpoint: 'https://lisbon.net.solidwallet.io/api/v3d',
    chainId: 2,
    tracker: 'https://tracker.lisbon.icon.community',
  },
};
