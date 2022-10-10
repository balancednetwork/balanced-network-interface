import store from 'store';

import { EthereumInstance } from '.';
import { sendLog } from '../../services/btpServices';
import { signingActions, getCurrentChain } from '../constants';
import { resetTransferStep } from '../ICONex/utils';
import { sendNoneNativeCoin } from './services';

const { modal } = store.dispatch;

const handleSuccessTx = txHash => {
  switch (window[signingActions.globalName]) {
    case signingActions.approve:
      sendNoneNativeCoin();
      break;

    default:
      EthereumInstance.refreshBalance();
      sendLog({
        txHash,
        network: getCurrentChain()?.NETWORK_ADDRESS?.split('.')[0],
      });
      resetTransferStep();
      break;
  }
};

const handleFailedTx = message => {
  modal.informFailedTx(message);
};

const handleError = error => {
  if (error.code === 4001) {
    modal.openModal({
      icon: 'exclamationPointIcon',
      desc: 'Transaction rejected.',
      button: {
        text: 'Dismiss',
        onClick: () => modal.setDisplay(false),
      },
    });
    return;
  } else {
    modal.informFailedTx(error.message);
  }
};

export { handleFailedTx, handleSuccessTx, handleError };
