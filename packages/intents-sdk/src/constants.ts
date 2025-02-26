import type { Chain } from 'viem';
import { arbitrum, polygon } from 'viem/chains';
import type { ChainConfig, ChainName, EvmChainConfig, IconChainConfig, SuiChainConfig } from './types.js';

export const DEFAULT_MAX_RETRY = 3;
export const DEFAULT_RETRY_DELAY_MS = 2000;
export const ICON_TX_RESULT_WAIT_MAX_RETRY = 10;

export const supportedChains: ChainName[] = ['arb', 'sui', 'pol'];

export function getEvmViemChain(chainName: ChainName): Chain {
  switch (chainName) {
    case 'arb':
      return arbitrum;
    case 'pol':
      return polygon;
    default:
      throw new Error(`Unsupported EVM chain: ${chainName}`);
  }
}

export const chainConfig: Record<ChainName, ChainConfig> = {
  ['arb']: {
    chain: {
      name: 'arb',
      type: 'evm',
    },
    nid: '0xa4b1.arbitrum',
    intentContract: '0x53E0095C57673fC16fA3FA2414bAD3200844Ec17',
    nativeToken: '0x0000000000000000000000000000000000000000',
    supportedTokens: [
      {
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
      },
      {
        symbol: 'wstETH',
        name: 'Wrapped stETH',
        decimals: 18,
        address: '0x5979D7b546E38E414F7E9822514be443A4800529',
      },
      {
        symbol: 'weETH',
        name: 'Wrapped eETH',
        decimals: 18,
        address: '0x35751007a407ca6FEFfE80b3cB397736D2cf4dbe',
      },
      {
        symbol: 'tBTC',
        name: 'Arbitrum tBTC v2',
        decimals: 18,
        address: '0x6c84a8f1c29108F47a79964b5Fe888D4f4D0dE40',
      },
    ],
  } satisfies EvmChainConfig,
  ['pol']: {
    chain: {
      name: 'pol',
      type: 'evm',
    },
    nid: '0x89.polygon',
    intentContract: '0xa3e6E49B5eDceb922f3729D2Ef8efd1c42aFFF0e',
    nativeToken: '0x0000000000000000000000000000000000000000',
    supportedTokens: [
      {
        symbol: 'POL',
        name: 'Polygon',
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      {
        symbol: 'WETH',
        name: 'Wrapped Ether',
        decimals: 18,
        address: '0x7ceB23fD6bC0adD59E62ac25578270cFf1b9f619',
      },
      {
        symbol: 'USDT',
        name: 'Tether USD (PoS)',
        decimals: 6,
        address: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
      },
      {
        symbol: 'USDC',
        name: 'USD Coin (PoS)',
        decimals: 6,
        address: '0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174',
      },
      {
        symbol: 'WPOL',
        name: 'Wrapped Polygon Ecosystem Token',
        decimals: 18,
        address: '0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270',
      },
    ],
  } satisfies EvmChainConfig,
  ['sui']: {
    chain: {
      name: 'sui',
      type: 'sui',
    },
    nid: 'sui',
    packageId: '0xbf8044a8f498b43e48ad9ad8a7d23027a45255903e8b4765dda38da2d1b89600',
    storageId: '0x78e96d7acd208baba0c37c1fd5d193088fa8f5ea45d18fa4c32eb3721307529d',
    nativeToken: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
    supportedTokens: [
      {
        symbol: 'SUI',
        name: 'SUI',
        decimals: 9,
        address: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
      },
      {
        symbol: 'AFSUI',
        name: 'Aftermath Staked SUI',
        decimals: 9,
        address: '0xf325ce1300e8dac124071d3152c5c5ee6174914f8bc2161e88329cf579246efc::afsui::AFSUI',
      },
      {
        symbol: 'HASUI',
        name: 'Haedal Staked SUI',
        decimals: 9,
        address: '0xbde4ba4c2e274a60ce15c1cfff9e5c42e41654ac8b6d906a57efa4bd3c29f47d::hasui::HASUI',
      },
      {
        symbol: 'VSUI',
        name: 'Volo Staked SUI',
        decimals: 9,
        address: '0x549e8b69270defbfafd4f94e17ec44cdbdd99820b33bda2278dea3b9a32d3f55::cert::CERT',
      },
      {
        symbol: 'mSUI',
        name: 'Mirai Staked SUI',
        decimals: 9,
        address: '0x922d15d7f55c13fd790f6e54397470ec592caa2b508df292a2e8553f3d3b274f::msui::MSUI',
      },
    ],
  } satisfies SuiChainConfig,
  ['icon']: {
    chain: {
      name: 'icon',
      type: 'icon',
    },
    nid: '0x1.icon',
    intentContract: 'cx55f6ac86d82a14022c338c8c0033eeceeeab382d',
    nativeToken: 'cx0000000000000000000000000000000000000000',
    supportedTokens: [
      {
        symbol: 'wICX',
        name: 'Wrapped ICX',
        decimals: 18,
        address: 'cx3975b43d260fb8ec802cef6e60c2f4d07486f11d',
      },
      {
        symbol: 'sICX',
        name: 'Staked ICX',
        decimals: 18,
        address: 'cx2609b924e33ef00b648a409245c7ea394c467824',
      },
      {
        symbol: 'bnUSD',
        name: 'Balanced Network USD',
        decimals: 18,
        address: 'cx88fd7df7ddff82f7cc735c871dc519838cb235bb',
      },
      {
        symbol: 'BALN',
        name: 'Balance Token',
        decimals: 18,
        address: 'cxf61cd5a45dc9f91c15aa65831a30a90d59a09619',
      },
    ],
  } satisfies IconChainConfig,
} as const;
