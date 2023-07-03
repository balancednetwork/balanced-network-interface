import IconService from 'icon-sdk-js';

import { chainConfigs } from './chainConfigs';

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
  REQUEST_JSON_RPC: 'REQUEST_JSON-RPC',
  RESPONSE_JSON_RPC: 'RESPONSE_JSON-RPC',
  CANCEL_JSON_RPC: 'CANCEL_JSON-RPC',
};

// export const NEAR_NODE = {
//   networkId: chainConfigs.NEAR?.NETWORK_ADDRESS,
//   contractId: chainConfigs.NEAR?.BTS_CORE,
//   nodeUrl: chainConfigs.NEAR?.RPC_URL,
//   walletUrl: chainConfigs.NEAR?.WALLET_URL,
//   helperUrl: chainConfigs.NEAR?.HELPER_URL,
//   explorerUrl: chainConfigs.NEAR?.EXPLORER_URL,
//   ICXNEP141Address: chainConfigs.NEAR?.ICX_NEP141_ADDRESS,
// };

export const ADDRESS_LOCAL_STORAGE = 'address';
export const CONNECTED_WALLET_LOCAL_STORAGE = 'connected-wallet';

export const SIGNING_ACTIONS = {
  GLOBAL_NAME: 'signingActions',
  TRANSFER: 'transfer',
  BID: 'bid',
  DEPOSIT: 'deposit',
  RECEIVER: 'receiver',
  APPROVE: 'approve',
  APPROVE_IRC2: 'approveIRC2',
  RECLAIM: 'reclaim',
};

export const rawTransaction = 'rawTransaction';
export const transactionInfo = 'transactionInfo';
export const txPayload = 'txPayload';
export const serverEndpoint = process.env.REACT_APP_BTP_ENDPOINT;
export const httpProvider = new IconService.HttpProvider(chainConfigs.ICON?.RPC_URL);
export const iconService = new IconService(httpProvider);
export const getCurrentChain = () => chainConfigs[window['accountInfo']?.id] || {};
