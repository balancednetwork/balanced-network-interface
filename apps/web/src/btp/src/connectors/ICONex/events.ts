import { EventPayload, TransactionResponse } from 'btp/src/type/transaction';
import { ICX_METHOD } from 'btp/src/utils/constants';

import { signingEventHandler } from '.';
import { TYPES, CONNECTED_WALLET_LOCAL_STORAGE } from '../constants';
import Request from './utils';

const createICONexEvent = (type: keyof typeof TYPES, payload?: EventPayload) => {
  const event = new CustomEvent('ICONEX_RELAY_REQUEST', { detail: { type: TYPES[type], payload } });
  window.dispatchEvent(event);
};

const requestHasAccount = () => {
  createICONexEvent('REQUEST_HAS_ACCOUNT');
};

export const checkICONexInstalled = callback => {
  requestHasAccount();

  return new Promise(function (resolve) {
    setTimeout(() => {
      if (isICONexInstalled()) {
        resolve(true);
      } else {
        resolve(false);
      }

      if (callback) callback();
    }, 2000);
  });
};

export const isICONexInstalled = () => window['hasICONexAccount'];

// connect to the wallet
export const requestAddress = async () => {
  if (!isICONexInstalled()) {
    // handle if the ICONex extension is not installed
    // https://github.com/icon-project/icon-sdk-js/issues/12#issuecomment-781446159
    localStorage.removeItem(CONNECTED_WALLET_LOCAL_STORAGE);
    window.open('https://chrome.google.com/webstore/detail/hana/jfdlamikmbghhapbgfoogdffldioobgl');
    return false;
  }
  createICONexEvent('REQUEST_ADDRESS');
  return true;
};

export const requestHasAddress = address => {
  return createICONexEvent('REQUEST_HAS_ADDRESS', address);
};

export const requestICONexSigning = transaction => {
  return createICONexEvent('REQUEST_SIGNING', transaction);
};

export const requestSigning = transaction => {
  return new Promise<TransactionResponse>(resolve => {
    const handler = async (evt: any) => {
      window.removeEventListener('ICONEX_RELAY_RESPONSE', handler);
      const res = await signingEventHandler(evt);
      resolve(res);
    };

    window.addEventListener('ICONEX_RELAY_RESPONSE', handler);

    createICONexEvent('REQUEST_JSON_RPC', new Request(ICX_METHOD.SEND_TRANSACTION, transaction));
  });
};
