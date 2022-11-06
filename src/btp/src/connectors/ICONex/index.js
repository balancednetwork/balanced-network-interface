import React from 'react';

import { t } from '@lingui/macro';
import { toast } from 'react-toastify';

import { TransactionStatus } from 'store/transactions/hooks';

import {
  NotificationPending,
  NotificationError,
  NotificationSuccess,
} from '../../../../app/components/Notification/TransactionNotification';
import { EVENTS, trigger } from '../../../../utils/customEvent';
import { chainConfigs, customzeChain } from '../chainConfigs';
import {
  TYPES,
  ADDRESS_LOCAL_STORAGE,
  CONNECTED_WALLET_LOCAL_STORAGE,
  signingActions,
  transactionInfo,
} from '../constants';
import { requestHasAddress } from './events';
import { getBalance, sendTransaction, getTxResult } from './ICONServices';
import { resetTransferStep } from './utils';

const eventHandler = async event => {
  const { type, payload = {} } = event.detail;
  const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);

  console.info('%cICONex event', 'color: green;', event.detail);

  if (payload.error) {
    console.log(payload.error.transferMessage);
    return;
  }

  const transInfo = window[transactionInfo];
  let transferMessage = null;
  let approveMessage = null;

  if (transInfo) {
    console.log('transInfo', transInfo);
    transferMessage = {
      pendingMessage: t`Transferring ${transInfo.coinName} from ${transInfo.networkSrc} to ${transInfo.networkDst}...`,
      successMessage: t`Transferred ${transInfo.value} ${transInfo.coinName} to ${transInfo.networkDst}.`,
      failureMessage: t`Couldn't transfer ${transInfo.coinName} to ${transInfo.networkDst}. Try again.`,
    };
    approveMessage = {
      pendingMessage: t`Approving ${transInfo.coinName} for cross-chain transfers...`,
      successMessage: t`Approved ${transInfo.coinName} for cross-chain transfers.`,
      failureMessage: t`Couldn't approve ${transInfo.coinName} for cross-chain transfers.`,
    };
  }

  switch (type) {
    // request for wallet address confirm
    case TYPES.RESPONSE_ADDRESS:
      getAccountInfo(payload);
      localStorage.setItem(ADDRESS_LOCAL_STORAGE, payload);
      break;

    // check if the wallet includes the current address
    case TYPES.RESPONSE_HAS_ADDRESS:
      console.info('%cICONex event', 'color: green;', payload);
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
        const link = `${chainConfigs[window['accountInfo'].id].EXPLORE_URL}transaction/${txHash}`;
        const toastProps = {
          onClick: () => window.open(link, '_blank'),
        };

        if (
          window[signingActions.globalName] === signingActions.approve ||
          window[signingActions.globalName] === signingActions.approveIRC2
        ) {
          toast(<NotificationPending summary={approveMessage.pendingMessage || t`Processing transaction...`} />, {
            ...toastProps,
            toastId: txHash,
          });
        } else {
          toast(<NotificationPending summary={transferMessage.pendingMessage || t`Processing transaction...`} />, {
            ...toastProps,
            toastId: txHash,
          });
        }

        await new Promise((resolve, reject) => {
          const checkTxRs = setInterval(async () => {
            try {
              const result = await getTxResult(txHash);
              // https://www.icondev.io/docs/icon-json-rpc-v3#icx_gettransactionresult
              if (!result.status || result.status === '0x0') {
                clearInterval(checkTxRs);
                throw new Error(result.failure.transferMessage);
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

                  toast.update(txHash, {
                    ...toastProps,
                    render: (
                      <NotificationSuccess
                        summary={
                          approveMessage.successMessage ||
                          t`You've approved to tranfer your token! Please click the Approve button on your wallet to perform transfer`
                        }
                      />
                    ),
                    autoClose: 3000,
                  });
                  trigger(EVENTS.APPROVE, { txHash, status: TransactionStatus.success });

                  // sendNonNativeCoin();
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
                  trigger(EVENTS.TRANSFER, { status: TransactionStatus.success });
                  // sendLog({
                  //   txHash,
                  //   network: getCurrentChain()?.NETWORK_ADDRESS?.split('.')[0],
                  // });
                  toast.update(txHash, {
                    ...toastProps,
                    render: (
                      <NotificationSuccess summary={transferMessage.successMessage || t`Successfully transfer!`} />
                    ),
                    autoClose: 3000,
                  });
                  // toast(<NotificationSuccess summary={transferMessage.successMessage || t`Successfully transfer!`} />, {
                  //   ...toastProps,
                  //   toastId: txHash,
                  //   autoClose: 3000,
                  // });

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
            console.log(err.transferMessage);
            break;
          case signingActions.approve:
          case signingActions.approveIRC2: {
            const link = `${chainConfigs[window['accountInfo'].id].EXPLORE_URL}transaction/${transInfo.txHash}`;
            const toastProps = {
              onClick: () => window.open(link, '_blank'),
            };
            trigger(EVENTS.APPROVE, { status: TransactionStatus.failure });
            toast.update(transInfo.txHash, {
              ...toastProps,
              render: (
                <NotificationError
                  summary={
                    approveMessage.failureMessage || t`Your transaction has failed. Please go back and try again.`
                  }
                />
              ),
              autoClose: 5000,
            });
            break;
          }
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
            if (signingActions.transfer === window[signingActions.globalName]) {
              trigger(EVENTS.TRANSFER, { status: TransactionStatus.failure });
            }
            let link = '';
            const currentNetworkConfig = chainConfigs[transInfo.networkSrc];
            transInfo.networkSrc === 'BSC' &&
              (link = `${currentNetworkConfig.EXPLORE_URL}/${currentNetworkConfig.exploreSuffix?.transaction}/${transInfo.txHash}`);
            // const link = getTrackerLink(transInfo.nid, transInfo.txhash, 'transaction');
            const toastProps = {
              onClick: () => window.open(link, '_blank'),
            };
            toast.update(transInfo.txHash, {
              ...toastProps,
              render: (
                <NotificationError
                  summary={
                    transferMessage.failureMessage || t`Your transaction has failed. Please go back and try again.`
                  }
                />
              ),
              autoClose: 5000,
            });
            // toast(
            //   <NotificationError
            //     summary={transferMessage.failureMessage || t`Your transaction has failed. Please go back and try again.`}
            //   />,
            //   {
            //     ...toastProps,
            //     toastId: transInfo.txhash,
            //     autoClose: 5000,
            //   },
            // );
            break;
        }
      }
      break;
    case TYPES.CANCEL_SIGNING:
    case TYPES.CANCEL_JSON_RPC: {
      console.log('Transaction rejected');
      // modal.openModal({
      //   icon: 'exclamationPointIcon',
      //   desc: 'Transaction rejected.',
      //   button: {
      //     text: 'Dismiss',
      //     onClick: () => modal.setDisplay(false),
      //   },
      // });
      switch (window[signingActions.globalName]) {
        case signingActions.approve:
        case signingActions.approveIRC2: {
          trigger(EVENTS.APPROVE, { status: TransactionStatus.failure });
          break;
        }
        case signingActions.transfer: {
          trigger(EVENTS.TRANSFER, { status: TransactionStatus.failure });
          break;
        }
        default:
          break;
      }
      break;
    }
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
