import { FailedBidContent } from 'components/NotificationModal/FailedBidContent';
import { SuccessSubmittedTxContent } from 'components/NotificationModal/SuccessSubmittedTxContent';
import { chainConfigs } from 'connectors/chainConfigs';
import { TYPES, ADDRESS_LOCAL_STORAGE, CONNECTED_WALLET_LOCAL_STORAGE, signingActions } from 'connectors/constants';

import store from 'store';

import { requestHasAddress } from './events';
import { getBalance, sendTransaction, getTxResult, sendNonNativeCoin } from './ICONServices';
import { resetTransferStep } from './utils';

const { modal, account } = store.dispatch;

const eventHandler = async event => {
  const { type, payload = {} } = event.detail;
  const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);

  console.info('%cICONex event', 'color: green;', event.detail);

  switch (type) {
    // request for wallet address confirm
    case TYPES.RESPONSE_ADDRESS:
      getAccountInfo(payload);
      localStorage.setItem(ADDRESS_LOCAL_STORAGE, payload);
      break;

    // check if the wallet includes the current address
    case TYPES.RESPONSE_HAS_ADDRESS:
      if (payload.hasAddress) {
        getAccountInfo(address);
      }
      break;

    case TYPES.RESPONSE_HAS_ACCOUNT:
      window.hasICONexAccount = true;
      break;

    case TYPES.RESPONSE_SIGNING:
    case TYPES.RESPONSE_JSON_RPC:
      try {
        modal.openModal({
          icon: 'loader',
          desc: 'Please wait a moment.',
        });

        const txHash = payload.result || (await sendTransaction(payload));

        await new Promise((resolve, reject) => {
          const checkTxRs = setInterval(async () => {
            try {
              const result = await getTxResult(txHash);
              // https://www.icondev.io/docs/icon-json-rpc-v3#icx_gettransactionresult
              if (!result.status || result.status === '0x0') {
                clearInterval(checkTxRs);
                throw new Error(result.failure.message);
              }

              switch (window[signingActions.globalName]) {
                case signingActions.bid:
                  modal.openModal({
                    icon: 'checkIcon',
                    desc: 'Congratulation! Your bid successfully placed.',
                    button: {
                      text: 'Continue bidding',
                      onClick: () => modal.setDisplay(false),
                    },
                  });
                  break;

                case signingActions.approve:
                  modal.openModal({
                    icon: 'checkIcon',
                    desc: `You've approved to tranfer your token! Please click the Transfer button to continue.`,
                    button: {
                      text: 'Transfer',
                      onClick: sendNonNativeCoin,
                    },
                  });
                  break;

                case signingActions.transfer:
                  modal.openModal({
                    icon: 'checkIcon',
                    children: <SuccessSubmittedTxContent />,
                    button: {
                      text: 'Continue transfer',
                      onClick: () => modal.setDisplay(false),
                    },
                  });

                  // latency time fo fetching new balance
                  setTimeout(async () => {
                    var balance = await getBalance(address);
                    setBalance(+balance);
                  }, 2000);
                  break;
                default:
                  break;
              }
              clearInterval(checkTxRs);
              resetTransferStep();
            } catch (err) {
              if (err && /(Pending|Executing)/g.test(err)) return;
              reject(err);
            }
          }, 2000);
        });
      } catch (err) {
        switch (window[signingActions.globalName]) {
          case signingActions.bid:
            modal.openModal({
              icon: 'xIcon',
              children: <FailedBidContent message={err.message || err} />,
              button: {
                text: 'Try again',
                onClick: () => modal.setDisplay(false),
              },
            });
            break;
          case signingActions.transfer:
          default:
            modal.openModal({
              icon: 'xIcon',
              desc: 'Your transaction has failed. Please go back and try again.',
              button: {
                text: 'Back to transfer',
                onClick: () => modal.setDisplay(false),
              },
            });
            break;
        }
      }
      break;
    case TYPES.CANCEL_SIGNING:
    case TYPES.CANCEL_JSON_RPC:
      modal.openModal({
        icon: 'exclamationPointIcon',
        desc: 'Transaction rejected.',
        button: {
          text: 'Dismiss',
          onClick: () => modal.setDisplay(false),
        },
      });
      break;

    case 'CANCEL':
      account.setAccountInfo({
        cancelConfirmation: true,
      });
      break;
    default:
      break;
  }
};

const getAccountInfo = async address => {
  try {
    const wallet = localStorage.getItem(CONNECTED_WALLET_LOCAL_STORAGE);
    const balance = +(await getBalance(address));
    await account.setAccountInfo({
      address,
      balance,
      wallet,
      unit: 'ICX',
      currentNetwork: chainConfigs.ICON?.CHAIN_NAME,
    });
  } catch (err) {
    console.log('Err: ', err);
    account.resetAccountInfo();
    modal.openModal({
      icon: 'xIcon',
      desc: 'Something went wrong',
    });
  }
};

const setBalance = balance => {
  account.setAccountInfo({
    balance,
  });
};

export const addICONexListener = () => {
  window.addEventListener('ICONEX_RELAY_RESPONSE', eventHandler);

  const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);
  if (address) {
    setTimeout(() => {
      requestHasAddress(address);
    }, 2000);
  }
};
