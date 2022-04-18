import { signingActions } from 'connectors/constants';

import { sendNativeCoin, setApproveForSendNonNativeCoin } from './ICONServices';

export const transfer = (tx, isSendingNativeCoin, token, network) => {
  window[signingActions.globalName] = signingActions.transfer;

  if (isSendingNativeCoin) {
    sendNativeCoin(tx, network);
  } else {
    setApproveForSendNonNativeCoin(tx);
  }
};
