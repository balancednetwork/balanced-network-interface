import { TYPES } from '../constants';

const createICONexEvent = (type, payload) => {
  const event = new CustomEvent('ICONEX_RELAY_REQUEST', { detail: { type, payload } });
  window.dispatchEvent(event);
};

const requestHasAccount = () => {
  createICONexEvent(TYPES.REQUEST_HAS_ACCOUNT);
};

export const checkICONexInstalled = callback => {
  requestHasAccount();

  return new Promise(function (resolve) {
    setTimeout(() => {
      if (window.hasICONexAccount) {
        resolve(true);
      } else {
        resolve(false);
      }

      if (callback) callback();
    }, 2000);
  });
};

export const isICONexInstalled = () => window.hasICONexAccount;

// connect to the wallet
export const requestAddress = () => {
  createICONexEvent(TYPES.REQUEST_ADDRESS);
};

export const requestHasAddress = address => {
  createICONexEvent(TYPES.REQUEST_HAS_ADDRESS, address);
};

export const requestICONexSigning = transaction => {
  createICONexEvent(TYPES.REQUEST_SIGNING, transaction);
};

export const requestHanaSigning = transaction => {
  createICONexEvent(TYPES.REQUEST_JSON_RPC, {
    jsonrpc: '2.0',
    method: 'icx_sendTransaction',
    params: transaction,
    id: new Date().getTime(),
  });
};
