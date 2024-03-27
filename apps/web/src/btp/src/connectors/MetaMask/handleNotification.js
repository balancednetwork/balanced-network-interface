import store from 'store';
import { TransactionStatus } from 'store/transactions/hooks';
import { EVENTS, trigger } from 'utils/customEvent';

import { EthereumInstance } from '.';
import { signingActions } from '../constants';
import { resetTransferStep } from '../ICONex/utils';

const { modal } = store.dispatch;

const handleTransferAsset = status => {
  switch (window[signingActions.globalName]) {
    case signingActions.approve: {
      trigger(EVENTS.APPROVE, { status });
      break;
    }
    case signingActions.transfer: {
      trigger(EVENTS.TRANSFER, { status });
      break;
    }
    default:
      break;
  }
};

const handleSuccessTx = txHash => {
  handleTransferAsset(TransactionStatus.success);
  switch (window[signingActions.globalName]) {
    case signingActions.approve:
      // sendNonNativeCoin();
      break;

    default:
      EthereumInstance.refreshBalance();
      // sendLog({
      //   txHash,
      //   network: getCurrentChain()?.NETWORK_ADDRESS?.split('.')[0],
      // });
      resetTransferStep();
      break;
  }
};

const handleFailedTx = message => {
  handleTransferAsset(TransactionStatus.failure);
  modal.informFailedTx(message);
};

const handleError = error => {
  handleTransferAsset(TransactionStatus.failure);
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
