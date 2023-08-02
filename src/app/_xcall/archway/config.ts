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

export const ARCHWAY_CHAIN: Chain = ARCHWAY_CHAINS[NETWORK_ID];
export const ARCHWAY_ASSET_LIST: AssetList = ARCHWAY_ASSET_LISTS[NETWORK_ID];
export const ARCHWAY_RPC_PROVIDER: string = ARCHWAY_RPC_PROVIDERS[NETWORK_ID];
