import { TransactionResponse } from 'btp/src/type/transaction';
import { ToastOptions, UpdateOptions } from 'react-toastify';

import { TransactionStatus } from 'store/transactions/hooks';

import { chainConfigs, customzeChain } from '../chainConfigs';
import {
  TYPES,
  ADDRESS_LOCAL_STORAGE,
  CONNECTED_WALLET_LOCAL_STORAGE,
  SIGNING_ACTIONS,
  transactionInfo,
} from '../constants';
import { getTransactionMessages, triggerSetAccountInfo } from '../helper';
import { openToast } from '../transactionToast';
// import { requestHasAddress } from './events';
import { getBalance, sendTransaction, getTxResult } from './ICONServices';
import { resetTransferStep } from './utils';

const eventHandler = async event => {
  const { type, payload = {} } = event.detail;
  const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);

  if (payload.error) {
    console.log(payload.error.transferMessage);
    return;
  }
  try {
    switch (type) {
      // request for wallet address confirm
      case TYPES.RESPONSE_ADDRESS:
        const accountInfo = await getAccountInfo(payload);
        triggerSetAccountInfo(accountInfo);

        localStorage.setItem(ADDRESS_LOCAL_STORAGE, payload);
        break;

      // check if the wallet includes the current address
      case TYPES.RESPONSE_HAS_ADDRESS:
        console.info('%cICONex event', 'color: green;', payload);
        if (payload.hasAddress && address !== null) {
          const accountInfo = await getAccountInfo(address);
          triggerSetAccountInfo(accountInfo);
        }
        break;

      case TYPES.RESPONSE_HAS_ACCOUNT:
        window['hasICONexAccount'] = true;
        break;

      case 'CANCEL':
        window['accountInfo'].cancelConfirmation = false;
        break;
      default:
        break;
    }
  } catch (err) {
    console.log(err);
  }
};

const getAccountInfo = async (address: string) => {
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
    return accountInfo;
  } catch (err) {
    console.log('Err: ', err);
    return null;
  }
};

export const setBalance = balance => {
  triggerSetAccountInfo({ balance });
};

export const signingEventHandler = async (event): Promise<TransactionResponse> => {
  const { type, payload = {} } = event.detail;
  const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);
  const transInfo = window[transactionInfo];
  const transactionMessages = getTransactionMessages(transInfo, window[SIGNING_ACTIONS.GLOBAL_NAME]);
  let toastProps: ToastOptions | UpdateOptions = {};
  const txParams = event.detail;
  if (payload.error) {
    console.log(payload.error.transferMessage);
    return {
      transactionStatus: TransactionStatus.failure,
      message: payload.error.transferMessage,
      txParams,
    };
  }

  console.log('event', event);

  try {
    switch (type) {
      case TYPES.RESPONSE_SIGNING:
      case TYPES.RESPONSE_JSON_RPC:
        console.log('Please wait a moment.');
        const txHash = payload.result || (await sendTransaction(payload));
        const currentNetworkConfig = chainConfigs[window['accountInfo'].id];
        const link = `${currentNetworkConfig.EXPLORE_URL}${currentNetworkConfig.exploreSuffix?.transaction}${txHash}`;
        toastProps = {
          onClick: () => {
            window.open(link, '_blank');
          },
        };
        openToast({
          id: txHash,
          options: toastProps,
          message: transactionMessages.pending,
        });

        const res = await new Promise<TransactionResponse>((resolve, reject) => {
          const checkTxRs = setInterval(async () => {
            try {
              const result = await getTxResult(txHash);
              // https://www.icondev.io/docs/icon-json-rpc-v3#icx_gettransactionresult
              if (!result.status || result.status === '0x0') {
                clearInterval(checkTxRs);
                throw new Error((result.failure as any)?.['transferMessage']);
              }

              if ([SIGNING_ACTIONS.TRANSFER].includes(window[SIGNING_ACTIONS.GLOBAL_NAME])) {
                setTimeout(async () => {
                  if (address) {
                    const balance = await getBalance(address);
                    console.log('balance', balance);
                    setBalance(+balance);
                  }
                }, 2000);
              }
              clearInterval(checkTxRs);
              openToast({
                id: txHash,
                options: toastProps,
                message: transactionMessages.success,
                transactionStatus: TransactionStatus.success,
              });
              resetTransferStep();
              resolve({
                message: transactionMessages.success,
                txHash: txHash,
                transaction: result,
                transactionStatus: TransactionStatus.success,
                txParams,
              });
            } catch (err) {
              if (err && /(Pending|Executing)/g.test(`${err}`)) {
                return;
              }
              clearInterval(checkTxRs);
              reject('Transaction error');
            }
          }, 2000);
        });
        return res;
      case TYPES.CANCEL_SIGNING:
      case TYPES.CANCEL_JSON_RPC: {
        const error = new Error('Cancel transaction');
        error.name = 'Cancel';
        throw error;
      }
      case 'CANCEL':
        window['accountInfo'].cancelConfirmation = false;
        break;
      default:
        break;
    }
    return {
      message: 'Empty',
      transactionStatus: TransactionStatus.success,
      txParams,
    };
  } catch (err) {
    switch (window[SIGNING_ACTIONS.GLOBAL_NAME]) {
      case SIGNING_ACTIONS.BID:
      case SIGNING_ACTIONS.APPROVE:
      case SIGNING_ACTIONS.APPROVE_IRC2: {
        console.log(err);
        toastProps.onClick = () => {
          const currentNetworkConfig = chainConfigs[window['accountInfo'].id];
          const link = `${currentNetworkConfig.EXPLORE_URL}${currentNetworkConfig.exploreSuffix?.transaction}${transInfo.txHash}`;
          if (link) {
            window.open(link, '_blank');
          }
        };
        break;
      }
      case SIGNING_ACTIONS.TRANSFER:
      default:
        toastProps.onClick = () => {
          const currentNetworkConfig = chainConfigs[window['accountInfo'].id];
          const link = `${currentNetworkConfig.EXPLORE_URL}${currentNetworkConfig.exploreSuffix?.transaction}${transInfo.txHash}`;
          if (link) {
            window.open(link, '_blank');
          }
        };
        break;
    }
    openToast({
      id: transInfo.txHash,
      options: toastProps,
      message: transactionMessages.failure,
      transactionStatus: TransactionStatus.failure,
    });
    return {
      message: transactionMessages.failure,
      txHash: transInfo.txHash,
      transactionStatus: TransactionStatus.failure,
      txParams,
    };
  }
};

export const addICONexListener = () => {
  window.addEventListener('ICONEX_RELAY_RESPONSE', eventHandler);

  // const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);
  // if (address) {
  //   setTimeout(() => {
  //     requestHasAddress(address);
  //   }, 2000);
  // }
};
