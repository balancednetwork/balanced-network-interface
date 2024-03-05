import { SupportedChainId } from '@balancednetwork/balanced-js';
import { Chain, AssetList } from '@chain-registry/types';
import { chains, assets } from 'chain-registry';

import { NETWORK_ID } from 'constants/config';

const ARCHWAY_MAINNET_NAME = 'archway';
const ARCHWAY_TESTNET_NAME = 'archwaytestnet';
const ARCHWAY_RPC_MAINNET_PROVIDER_NAME = 'Archway Foundation';
const ARCHWAY_RPC_TESTNET_PROVIDER_NAME = 'Archway';
const DEFAULT_RPC_MAINNET = 'https://rpc.mainnet.archway.io';
const DEFAULT_RPC_TESTNET = 'https://rpc.constantine.archway.tech';

const ARCHWAY_CHAINS: { [key in SupportedChainId]: Chain } = {
  [SupportedChainId.MAINNET]: chains.find(chain => chain.chain_name === ARCHWAY_MAINNET_NAME) as Chain,
  [SupportedChainId.BERLIN]: chains.find(chain => chain.chain_name === ARCHWAY_TESTNET_NAME) as Chain,

  [SupportedChainId.LISBON]: chains.find(chain => chain.chain_name === ARCHWAY_TESTNET_NAME) as Chain,
  [SupportedChainId.SEJONG]: chains.find(chain => chain.chain_name === ARCHWAY_TESTNET_NAME) as Chain,
  [SupportedChainId.YEOUIDO]: chains.find(chain => chain.chain_name === ARCHWAY_TESTNET_NAME) as Chain,
};

const ARCHWAY_ASSET_LISTS: { [key in SupportedChainId]: AssetList } = {
  [SupportedChainId.MAINNET]: assets.find(asset => asset.chain_name === ARCHWAY_MAINNET_NAME) as AssetList,
  [SupportedChainId.BERLIN]: assets.find(asset => asset.chain_name === ARCHWAY_TESTNET_NAME) as AssetList,

  [SupportedChainId.LISBON]: assets.find(asset => asset.chain_name === ARCHWAY_TESTNET_NAME) as AssetList,
  [SupportedChainId.SEJONG]: assets.find(asset => asset.chain_name === ARCHWAY_TESTNET_NAME) as AssetList,
  [SupportedChainId.YEOUIDO]: assets.find(asset => asset.chain_name === ARCHWAY_TESTNET_NAME) as AssetList,
};

const ARCHWAY_RPC_PROVIDERS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]:
    ARCHWAY_CHAINS[SupportedChainId.MAINNET].apis?.rpc?.find(api => api.provider === ARCHWAY_RPC_MAINNET_PROVIDER_NAME)
      ?.address || DEFAULT_RPC_MAINNET,
  [SupportedChainId.BERLIN]:
    ARCHWAY_CHAINS[SupportedChainId.BERLIN].apis?.rpc?.find(api => api.provider === ARCHWAY_RPC_TESTNET_PROVIDER_NAME)
      ?.address || DEFAULT_RPC_TESTNET,
  [SupportedChainId.LISBON]:
    ARCHWAY_CHAINS[SupportedChainId.LISBON].apis?.rpc?.find(api => api.provider === ARCHWAY_RPC_TESTNET_PROVIDER_NAME)
      ?.address || DEFAULT_RPC_TESTNET,
  [SupportedChainId.SEJONG]:
    ARCHWAY_CHAINS[SupportedChainId.SEJONG].apis?.rpc?.find(api => api.provider === ARCHWAY_RPC_TESTNET_PROVIDER_NAME)
      ?.address || DEFAULT_RPC_TESTNET,
  [SupportedChainId.YEOUIDO]:
    ARCHWAY_CHAINS[SupportedChainId.YEOUIDO].apis?.rpc?.find(api => api.provider === ARCHWAY_RPC_TESTNET_PROVIDER_NAME)
      ?.address || DEFAULT_RPC_TESTNET,
};

type CW20_BASIC_TYPE = {
  address: string;
  decimals: number;
  denom: string;
};

const ARCHWAY_CW20_COLLATERALS: { [key in SupportedChainId]: CW20_BASIC_TYPE } = {
  [SupportedChainId.MAINNET]: {
    address: 'archway1t2llqsvwwunf98v692nqd5juudcmmlu3zk55utx7xtfvznel030saclvq6',
    decimals: 18,
    denom: 'sARCH',
  },
  [SupportedChainId.BERLIN]: {
    address: 'cx1f94585b61e47db9d5e036307f96a3251a0486a1',
    decimals: 18,
    denom: 'sARCH',
  },
  [SupportedChainId.LISBON]: {
    address: 'cx1f94585b61e47db9d5e036307f96a3251a0486a1',
    decimals: 18,
    denom: 'sARCH',
  },
  [SupportedChainId.SEJONG]: {
    address: 'cx1f94585b61e47db9d5e036307f96a3251a0486a1',
    decimals: 18,
    denom: 'sARCH',
  },
  [SupportedChainId.YEOUIDO]: {
    address: 'cx1f94585b61e47db9d5e036307f96a3251a0486a1',
    decimals: 18,
    denom: 'sARCH',
  },
};

type ContractSetType = {
  xcall: string;
  bnusd: string;
  assetManager: string;
  liquidSwap: string;
};

const ARCHWAY_CONTRACTS_: { [key in SupportedChainId]: ContractSetType } = {
  [SupportedChainId.MAINNET]: {
    xcall: 'archway19hzhgd90etqc3z2qswumq80ag2d8het38r0al0r4ulrly72t20psdrpna6',
    bnusd: 'archway1l3m84nf7xagkdrcced2y0g367xphnea5uqc3mww3f83eh6h38nqqxnsxz7',
    assetManager: 'archway1sg2kgqjhj7vyu0x9tflx4ju9vjn2x6c7g39vx3tv9ethfg9d9zns6ajpja',
    liquidSwap: 'archway1ywv0gxrw3kv25kn9f05dtqf6577fer5pc2vewvgcagpm5p8l4kuqc4qfp6',
  },
  [SupportedChainId.BERLIN]: {
    xcall: 'archway1kenxz0wuczr04mc9q3gwjuyzd6ft4zqm5wach846gghfjupvlncshvchs2',
    bnusd: 'archway1dxs0j8rk8yd69rdh77ndrefhjzdy3lehujx58yhfxr827nr7rutqpltd2w',
    assetManager: 'archway18aqg8wgmhrjkdnc4ne6y004w3y4lsjc5mujypvkqn45vwne9zdjsjg3lfm',
    liquidSwap: 'archway1wwsvs9nyldsuk3sen36zh2kvxzpc4wg0z9afnz9n25hx22hsxapqfceh3d',
  },
  [SupportedChainId.LISBON]: {
    xcall: 'archway1h04c8eqr99dnsw6wqx80juj2vtuxth70eh65cf6pnj4zan6ms4jqshc5wk',
    bnusd: 'archway1dxs0j8rk8yd69rdh77ndrefhjzdy3lehujx58yhfxr827nr7rutqpltd2w',
    assetManager: 'archway18kf5sjwk4z007ulz8lhgsjjk860rup0n65a84nkys08s522gt5yqwdasmr',
    liquidSwap: 'archway1wwsvs9nyldsuk3sen36zh2kvxzpc4wg0z9afnz9n25hx22hsxapqfceh3d',
  },
  [SupportedChainId.SEJONG]: {
    xcall: 'archway1kenxz0wuczr04mc9q3gwjuyzd6ft4zqm5wach846gghfjupvlncshvchs2',
    bnusd: 'archway1dxs0j8rk8yd69rdh77ndrefhjzdy3lehujx58yhfxr827nr7rutqpltd2w',
    assetManager: 'archway18aqg8wgmhrjkdnc4ne6y004w3y4lsjc5mujypvkqn45vwne9zdjsjg3lfm',
    liquidSwap: 'archway1wwsvs9nyldsuk3sen36zh2kvxzpc4wg0z9afnz9n25hx22hsxapqfceh3d',
  },
  [SupportedChainId.YEOUIDO]: {
    xcall: 'archway1kenxz0wuczr04mc9q3gwjuyzd6ft4zqm5wach846gghfjupvlncshvchs2',
    bnusd: 'archway1dxs0j8rk8yd69rdh77ndrefhjzdy3lehujx58yhfxr827nr7rutqpltd2w',
    assetManager: 'archway18aqg8wgmhrjkdnc4ne6y004w3y4lsjc5mujypvkqn45vwne9zdjsjg3lfm',
    liquidSwap: 'archway1wwsvs9nyldsuk3sen36zh2kvxzpc4wg0z9afnz9n25hx22hsxapqfceh3d',
  },
};

const ARCHWAY_TRACKER_LINKS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: 'https://www.mintscan.io/archway/tx/',
  [SupportedChainId.BERLIN]: 'https://testnet.mintscan.io/archway-testnet/txs/',
  [SupportedChainId.LISBON]: 'https://testnet.mintscan.io/archway-testnet/txs/',
  [SupportedChainId.SEJONG]: 'https://testnet.mintscan.io/archway-testnet/txs/',
  [SupportedChainId.YEOUIDO]: 'https://testnet.mintscan.io/archway-testnet/txs/',
};

const ARCHWAY_WEBSOCKET_URLS: { [key in SupportedChainId]: string } = {
  [SupportedChainId.MAINNET]: 'wss://rpc.mainnet.archway.io:443/websocket',
  [SupportedChainId.BERLIN]: 'wss://rpc.constantine.archway.tech:443/websocket',
  [SupportedChainId.LISBON]: 'wss://rpc.constantine.archway.tech:443/websocket',
  [SupportedChainId.SEJONG]: 'wss://rpc.constantine.archway.tech:443/websocket',
  [SupportedChainId.YEOUIDO]: 'wss://rpc.constantine.archway.tech:443/websocket',
};

const AUTO_EXECUTION_ON_ARCHWAY_: { [key in SupportedChainId]: boolean } = {
  [SupportedChainId.MAINNET]: true,
  [SupportedChainId.BERLIN]: true,
  [SupportedChainId.LISBON]: true,
  [SupportedChainId.YEOUIDO]: false,
  [SupportedChainId.SEJONG]: false,
};

export const ARCHWAY_CHAIN: Chain = ARCHWAY_CHAINS[NETWORK_ID];
export const ARCHWAY_ASSET_LIST: AssetList = ARCHWAY_ASSET_LISTS[NETWORK_ID];
export const ARCHWAY_RPC_PROVIDER: string = ARCHWAY_RPC_PROVIDERS[NETWORK_ID];
export const ARCHWAY_CW20_COLLATERAL: CW20_BASIC_TYPE = ARCHWAY_CW20_COLLATERALS[NETWORK_ID];
export const ARCHWAY_CONTRACTS: ContractSetType = ARCHWAY_CONTRACTS_[NETWORK_ID];
export const ARCHWAY_WEBSOCKET_URL: string = ARCHWAY_WEBSOCKET_URLS[NETWORK_ID];
export const ARCHWAY_TRACKER_LINK: string = ARCHWAY_TRACKER_LINKS[NETWORK_ID];
export const AUTO_EXECUTION_ON_ARCHWAY: boolean = AUTO_EXECUTION_ON_ARCHWAY_[NETWORK_ID];
