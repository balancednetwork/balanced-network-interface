import { checkIsToken } from '../chainConfigs';
import { SIGNING_ACTIONS } from '../constants';
import { sendNativeCoin, setApproveForSendNonNativeCoin, approveIRC2 } from './ICONServices';

export const transfer = (tx, isSendingNativeCoin, token) => {
  window[SIGNING_ACTIONS.GLOBAL_NAME] = SIGNING_ACTIONS.TRANSFER;
  const isToken = checkIsToken(token);

  if (isSendingNativeCoin) {
    return sendNativeCoin(tx);
  } else if (isToken) {
    return approveIRC2(tx);
  } else {
    return setApproveForSendNonNativeCoin(tx);
  }
};
