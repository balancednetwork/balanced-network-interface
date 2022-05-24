import React from 'react';

import { t } from '@lingui/macro';
import { toast } from 'react-toastify';

import {
  NotificationPending,
  NotificationError,
  NotificationSuccess,
} from '../../../../app/components/Notification/TransactionNotification';
import { transferAssetMessage } from '../../../../app/components/trade/utils';
import { getTrackerLink } from '../../../../utils';
import { chainConfigs, customzeChain } from '../chainConfigs';
import {
  TYPES,
  ADDRESS_LOCAL_STORAGE,
  CONNECTED_WALLET_LOCAL_STORAGE,
  signingActions,
  transactionInfo,
} from '../constants';
import { requestHasAddress } from './events';
import { getBalance, sendTransaction, getTxResult, sendNonNativeCoin, transferIRC2 } from './ICONServices';
import { resetTransferStep } from './utils';

const eventHandler = async event => {
  const { type, payload = {} } = event.detail;
  const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);

  console.info('%cICONex event', 'color: green;', event.detail);

  if (payload.error) {
    console.log(payload.error.message);
    return;
  }

  const transInfo = window[transactionInfo];
  let message = null;
  transInfo &&
    (message = transferAssetMessage(transInfo.value, transInfo.coinName, transInfo.to, transInfo.networkDst));
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
        // modal.openModal({
        //   icon: 'loader',
        //   desc: 'Please wait a moment.',
        // });
        console.log('Please wait a moment.');

        const txHash = payload.result || (await sendTransaction(payload));
        transInfo.txhash = txHash;

        const link = getTrackerLink(transInfo.nid, txHash, 'transaction');
        const toastProps = {
          onClick: () => window.open(link, '_blank'),
        };

        toast(<NotificationPending summary={message.pendingMessage || t`Processing transaction...`} />, {
          ...toastProps,
          toastId: txHash,
          autoClose: 5000,
        });

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
                  // modal.openModal({
                  //   icon: 'checkIcon',
                  //   desc: 'C',
                  //   button: {
                  //     text: 'Continue bidding',
                  //     onClick: () => modal.setDisplay(false),
                  //   },
                  // });
                  console.log('Congratulation! Your bid successfully placed.');
                  break;

                case signingActions.approve:
                case signingActions.approveIRC2:
                  console.log("You've approved to tranfer your token! Please click the Transfer button to continue.");
                  // modal.openModal({
                  //   icon: 'checkIcon',
                  //   desc: `You've approved to tranfer your token! Please click the Transfer button to continue.`,
                  //   button: {
                  //     text: 'Transfer',
                  //     onClick:
                  //       window[signingActions.globalName] === signingActions.approve ? sendNonNativeCoin : transferIRC2,
                  //   },
                  // });
                  break;

                case signingActions.transfer:
                  // modal.openModal({
                  //   icon: 'checkIcon',
                  //   children: <SuccessSubmittedTxContent />,
                  //   button: {
                  //     text: 'Continue transfer',
                  //     onClick: () => modal.setDisplay(false),
                  //   },
                  // });
                  console.log('Successfully transfer');
                  // sendLog({
                  //   txHash,
                  //   network: getCurrentChain()?.NETWORK_ADDRESS?.split('.')[0],
                  // });
                  debugger;
                  toast(<NotificationSuccess summary={message.successMessage || t`Successfully transfer!`} />, {
                    ...toastProps,
                    toastId: txHash,
                    autoClose: 5000,
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
              clearInterval(checkTxRs);
              reject(err);
            }
          }, 2000);
        });
      } catch (err) {
        switch (window[signingActions.globalName]) {
          case signingActions.bid:
            console.log(err.message);
            break;
          case signingActions.transfer:
          default:
            console.log(err);
            console.log('Your transaction has failed. Please go back and try again.');
            // modal.openModal({
            //   icon: 'xIcon',
            //   desc: 'Your transaction has failed. Please go back and try again.',
            //   button: {
            //     text: 'Back to transfer',
            //     onClick: () => modal.setDisplay(false),
            //   },
            // });

            const link = getTrackerLink(transInfo.nid, transInfo.txhash, 'transaction');
            const toastProps = {
              onClick: () => window.open(link, '_blank'),
            };
            toast(
              <NotificationError
                summary={message.failureMessage || t`Your transaction has failed. Please go back and try again.`}
              />,
              {
                ...toastProps,
                toastId: transInfo.txhash,
                autoClose: 5000,
              },
            );
            break;
        }
      }
      break;
    case TYPES.CANCEL_SIGNING:
    case TYPES.CANCEL_JSON_RPC:
      console.log('Transaction rejected');
      // modal.openModal({
      //   icon: 'exclamationPointIcon',
      //   desc: 'Transaction rejected.',
      //   button: {
      //     text: 'Dismiss',
      //     onClick: () => modal.setDisplay(false),
      //   },
      // });
      break;

    case 'CANCEL':
      window.accountInfo.cancelConfirmation = false;
      break;
    default:
      break;
  }
};

const getAccountInfo = async address => {
  try {
    const wallet = localStorage.getItem(CONNECTED_WALLET_LOCAL_STORAGE);
    const balance = +(await getBalance(address));
    const id = 'ICON';
    customzeChain(id);
    const accountInfo = {
      address,
      balance,
      wallet,
      symbol: 'ICX',
      currentNetwork: chainConfigs.ICON?.CHAIN_NAME,
      id,
    };
    window.accountInfo = accountInfo;

    console.log(window.accountInfo);
    // await account.setAccountInfo({
    //   address,
    //   balance,
    //   wallet,
    //   symbol: 'ICX',
    //   currentNetwork: chainConfigs.ICON?.CHAIN_NAME,
    //   id,
    // });
  } catch (err) {
    console.log('Err: ', err);
    window.accountInfo = null;
    // modal.openModal({
    //   icon: 'xIcon',
    //   desc: 'Something went wrong',
    // });
  }
};

const setBalance = balance => {
  window.accountInfo.balance = balance;
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
