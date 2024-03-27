import { TransferTransactionRequest } from 'btp/src/type/transaction';

import { checkIRC2Token } from '../chainConfigs';
import { SIGNING_ACTIONS } from '../constants';
import { sendNativeCoin, setApproveForSendNonNativeCoin, approveIRC2 } from './ICONServices';

export const transfer = (tx: TransferTransactionRequest, isSendingNativeCoin: boolean, token: string) => {
  window[SIGNING_ACTIONS.GLOBAL_NAME] = SIGNING_ACTIONS.TRANSFER;
  const isIRC2Token = checkIRC2Token(token);

  if (isSendingNativeCoin) {
    return sendNativeCoin(tx);
  } else if (isIRC2Token) {
    return approveIRC2(tx);
  } else {
    return setApproveForSendNonNativeCoin(tx);
  }
};
