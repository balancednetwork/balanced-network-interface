import type { ChainConfig, ChainName, EvmChainConfig, SuiChainConfig } from './types.js';
import { arbitrum } from 'viem/chains';
import type { Chain } from 'viem';

export const DEFAULT_MAX_RETRY = 3;
export const DEFAULT_RETRY_DELAY_MS = 2000;
export const SOLVER_API_ENDPOINT = 'http://34.224.47.185'; // TODO - replace with the production one

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
        decimals: 18,
        address: '0x0000000000000000000000000000000000000000',
      },
      {
        symbol: 'WETH',
        decimals: 18,
        address: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1',
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
        decimals: 9,
        address: '0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI',
      },
    ],
  } satisfies SuiChainConfig,
} as const;
