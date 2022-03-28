import { connectedNetWorks, pairedNetworks, getPairedNetwork } from 'btp/src/utils/constants';
import IconService from 'icon-sdk-js';

// https://www.icondev.io/iconex-connect/chrome-extension#methods
export const TYPES = {
  REQUEST_HAS_ACCOUNT: 'REQUEST_HAS_ACCOUNT',
  RESPONSE_HAS_ACCOUNT: 'RESPONSE_HAS_ACCOUNT',
  REQUEST_ADDRESS: 'REQUEST_ADDRESS',
  RESPONSE_ADDRESS: 'RESPONSE_ADDRESS',
  REQUEST_HAS_ADDRESS: 'REQUEST_HAS_ADDRESS',
  RESPONSE_HAS_ADDRESS: 'RESPONSE_HAS_ADDRESS',
  REQUEST_SIGNING: 'REQUEST_SIGNING',
  RESPONSE_SIGNING: 'RESPONSE_SIGNING',
  CANCEL_SIGNING: 'CANCEL_SIGNING',
};

export const ADDRESS_LOCAL_STORAGE = 'address';
export const CONNECTED_WALLET_LOCAL_STORAGE = 'connected-wallet';

export const signingActions = {
  globalName: 'signingActions',
  transfer: 'transfer',
  bid: 'bid',
  deposit: 'deposit',
  receiver: 'receiver',
  approve: 'approve',
};

export const rawTransaction = 'rawTransaction';

export const allowedNetworkIDs = {
  metamask: {
    '0x507': connectedNetWorks.moonbeam,
    '0x61': connectedNetWorks.bsc,
    '0x4': 'Rinkeby',
  },
};

export const NEAR_NODE = {
  [connectedNetWorks.near]: true,
  networkId: process.env.REACT_APP_NEAR_NETWORK_ID,
  contractId: process.env.REACT_APP_NEAR_CONTRACT_ID,
  nodeUrl: process.env.REACT_APP_NEAR_NODE_URL,
  walletUrl: process.env.REACT_APP_NEAR_WALLET_URL,
  helperUrl: process.env.REACT_APP_NEAR_HELPER_URL,
  explorerUrl: process.env.REACT_APP_NEAR_EXPLORER_URL,
};

export const BSC_NODE = {
  [connectedNetWorks.bsc]: true,
  RPCUrl: process.env.REACT_APP_BSC_RPC_URL,
  networkAddress: process.env.REACT_APP_BSC_NETWORK_ADDRESS,
  BSHCore: process.env.REACT_APP_BSC_BSH_CORE,
  tokenBSHProxy: process.env.REACT_APP_BSC_TOKEN_BSH_PROXY,
  BEP20TKN: process.env.REACT_APP_BSC_BEP20_TKN,
};

export const MOON_BEAM_NODE = {
  [connectedNetWorks.moonbeam]: true,
  RPCUrl: process.env.REACT_APP_MB_RPC_URL,
  BSHCore: process.env.REACT_APP_MB_BSH_CORE,
  BSHICX: process.env.REACT_APP_MB_BSH_ICX,
  networkAddress: process.env.REACT_APP_MB_NETWORK_ADDRESS,
  gasLimit: process.env.REACT_APP_MB_GAS_LIMIT,
};

export const ICON_NODES = {
  [pairedNetworks['ICON-Moonbeam']]: {
    name: connectedNetWorks.icon,
    endpoint: process.env.REACT_APP_ICON_RPC_URL,
    nid: process.env.REACT_APP_ICON_NID,
    networkAddress: process.env.REACT_APP_ICON_NETWORK_ADDRESS,
    irc31token: process.env.REACT_APP_ICON_IRC31_TOKEN,
    irc2token: process.env.REACT_APP_ICON_IRC2_TOKEN,
    BSHAddress: process.env.REACT_APP_ICON_BSH_ADDRESS, // used to get the BTP fee from getBTPfee()
    stepLimit: process.env.REACT_APP_ICON_STEP_LIMIT,
  },
  [pairedNetworks['ICON-NEAR']]: {
    name: connectedNetWorks.icon,
    endpoint: process.env.REACT_APP_ICON_RPC_URL,
  },
  [pairedNetworks['ICON-BSC']]: {
    name: connectedNetWorks.icon,
    endpoint: process.env.REACT_APP_ICON_BSC_RPC_URL,
    nid: process.env.REACT_APP_ICON_BSC_NID,
    networkAddress: process.env.REACT_APP_ICON_BSC_NETWORK_ADDRESS,
    irc2token: process.env.REACT_APP_ICON_BSC_IRC2_TOKEN_ADDRESS,
    irc31token: process.env.REACT_APP_ICON_BSC_IRC31_TOKEN,
    BSHAddress: process.env.REACT_APP_ICON_BSC_BSH_ADDRESS, // used to get the BTP fee from getBTPfee()
    TOKEN_BSH_ADDRESS: process.env.REACT_APP_ICON_BSC_TOKEN_BSH_ADDRESS,
  },
};

const currentPairedNetworks = getPairedNetwork();
let currentICONexNetwork = currentPairedNetworks ? ICON_NODES[currentPairedNetworks] : ICON_NODES['ICON-Moonbeam'];

if (process.env.JEST_WORKER_ID === undefined) {
  console.log('BSC_NODE', BSC_NODE);
  console.log('MOON_BEAM_NODE', MOON_BEAM_NODE);
  console.log(currentPairedNetworks, currentICONexNetwork);
}

export const getCurrentICONexNetwork = () => currentICONexNetwork;
export const getServerEndpoint = pairedNetworksValue => {
  switch (pairedNetworksValue) {
    case pairedNetworks['ICON-BSC']:
      return process.env.REACT_APP_BTP_ENDPOINT_BSC;
    case pairedNetworks['ICON-Moonbeam']:
      return process.env.REACT_APP_BTP_ENDPOINT_MOONBEAM;
    case pairedNetworks['ICON-NEAR']:
      return process.env.REACT_APP_BTP_ENDPOINT_MOONBEAM; // TODO: update the right endpoint
    default:
      console.log('No matching paired network');
      break;
  }
};

export let serverEndpoint = getServerEndpoint(currentPairedNetworks);
export let httpProvider = new IconService.HttpProvider(currentICONexNetwork.endpoint);
export let iconService = new IconService(httpProvider);

// On dev process, we now have 2 paires of networks: ICON-Moonbeam & ICON-BSC
// This fuction will handle switching back and forth between these paired networks
export const setCurrentICONexNetwork = pairedNetworksValue => {
  currentICONexNetwork = ICON_NODES[pairedNetworksValue];
  serverEndpoint = getServerEndpoint(pairedNetworksValue);

  httpProvider = new IconService.HttpProvider(currentICONexNetwork.endpoint);
  iconService = new IconService(httpProvider);
};
