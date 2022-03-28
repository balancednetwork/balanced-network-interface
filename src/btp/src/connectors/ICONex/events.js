import { wallets } from 'btp/src/utils/constants';

import { TYPES, CONNECTED_WALLET_LOCAL_STORAGE } from '../constants';

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
  if (!isICONexInstalled()) {
    // handle if the ICONex extension is not installed
    // https://github.com/icon-project/icon-sdk-js/issues/12#issuecomment-781446159
    const selectedWallet = localStorage.getItem(CONNECTED_WALLET_LOCAL_STORAGE);
    localStorage.removeItem(CONNECTED_WALLET_LOCAL_STORAGE);
    if (selectedWallet === wallets.hana) {
      window.open('https://chrome.google.com/webstore/detail/hana/jfdlamikmbghhapbgfoogdffldioobgl');
      return;
    } else {
      window.open('https://chrome.google.com/webstore/detail/iconex/flpiciilemghbmfalicajoolhkkenfel');
      return;
    }
  }
  createICONexEvent(TYPES.REQUEST_ADDRESS);
};

export const requestHasAddress = address => {
  createICONexEvent(TYPES.REQUEST_HAS_ADDRESS, address);
};

export const requestSigning = transaction => {
  createICONexEvent(TYPES.REQUEST_SIGNING, transaction);
};
