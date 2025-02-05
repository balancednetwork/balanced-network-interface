import type { Chain } from 'viem';
import { arbitrum } from 'viem/chains';
import type { ChainConfig, ChainName, EvmChainConfig, SuiChainConfig } from './types.js';

export const DEFAULT_MAX_RETRY = 3;
export const DEFAULT_RETRY_DELAY_MS = 2000;

export const supportedChains: ChainName[] = ['arb', 'sui'];

export function getEvmViemChain(chainName: ChainName): Chain {
  switch (chainName) {
    case 'arb':
      return arbitrum;
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
} as const;
