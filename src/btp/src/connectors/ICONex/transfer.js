import { checkIsToken } from '../chainConfigs';
import { signingActions } from '../constants';
import { sendNativeCoin, setApproveForSendNonNativeCoin, approveIRC2, sendNonNativeCoin } from './ICONServices';

export const approve = async (tx, token) => {
  const isToken = checkIsToken(token);
  let data = null;
  if (isToken) {
    data = await approveIRC2(tx);
  } else {
    data = await setApproveForSendNonNativeCoin(tx);
  }
  return data;
};

export const transfer = (tx, token, isApproved) => {
  window[signingActions.globalName] = signingActions.transfer;
  const symbol = window['accountInfo'].symbol;
  const isSendingNativeCoin = symbol === token;
  if (isSendingNativeCoin) {
    sendNativeCoin(tx);
  } else {
    sendNonNativeCoin();
  }
};
