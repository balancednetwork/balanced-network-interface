import { ethers } from 'ethers';
import IconService from 'icon-sdk-js';

import store from 'store';

import { roundNumber } from '../../utils/app';
import { connectedNetWorks } from '../../utils/constants';
import {
  getCurrentICONexNetwork,
  ADDRESS_LOCAL_STORAGE,
  MOON_BEAM_NODE,
  BSC_NODE,
  signingActions,
  rawTransaction,
  iconService,
  httpProvider,
} from '../constants';
import { requestSigning } from './events';
import Request, { convertToICX, convertToLoopUnit, makeICXCall } from './utils';

const { IcxTransactionBuilder, CallTransactionBuilder } = IconService.IconBuilder;
const { serialize } = IconService.IconUtil;

export { transfer } from './transfer';

const { modal } = store.dispatch;

export const serviceName = connectedNetWorks.icon;

/**
 * Get balance from an ICON address
 * @param {string} address The ICON address
 * @returns {string} balance in a user-friendly format
 */
export const getBalance = address => {
  // https://github.com/icon-project/icon-sdk-js/issues/26#issuecomment-843988076
  return iconService
    .getBalance(address)
    .execute()
    .then(balance => {
      return convertToICX(balance);
    });
};

/**
 * Send a transaction to ICON network
 * @param {string} signature The signature for the payload
 */
export const sendTransaction = async signature => {
  try {
    if (!signature || !window[rawTransaction]) throw new Error('invalid send transaction params');

    const request = new Request('icx_sendTransaction', {
      ...window[rawTransaction],
      signature,
    });

    return await httpProvider.request(request).execute();
  } catch (err) {
    throw new Error(err.message || err);
  }
};

/**
 * Get transaction result
 * https://www.icondev.io/icon-node/goloop/json-rpc/jsonrpc_v3#icx_gettransactionresult
 * @param {string} txHash Transaction hash
 */
export const getTxResult = txHash => {
  try {
    return iconService
      .getTransactionResult(txHash)
      .execute()
      .then(rs => {
        return rs;
      });
  } catch (err) {
    throw new Error(err.message);
  }
};

/**
 * Set approval for sending non-native token
 * @param {object} tx Transaction object
 */
export const setApproveForSendNonNativeCoin = async tx => {
  const { to, coinName, value } = tx;
  const bshAddress = await getBSHAddressOfCoinName(coinName);

  const transaction = {
    to: bshAddress,
  };

  const options = {
    builder: new CallTransactionBuilder(),
    method: 'approve',
    params: {
      spender: getCurrentICONexNetwork().BSHAddress,
      amount: ethers.utils.parseEther(value).toString(10),
    },
  };

  window[rawTransaction] = tx;
  window[signingActions.receiver] = to;
  window[signingActions.globalName] = signingActions.approve;
  signTx(transaction, options);
  return { transaction, options };
};

/**
 * Send non-native token which was approved
 */
export const sendNonNativeCoin = () => {
  const transaction = {
    to: getCurrentICONexNetwork().BSHAddress,
  };

  const options = {
    builder: new CallTransactionBuilder(),
    method: 'transfer',
    params: {
      _to: `btp://${MOON_BEAM_NODE.networkAddress}/${window[signingActions.receiver]}`,
      _value: window[rawTransaction].data.params.amount,
      _coinName: 'DEV',
    },
  };

  window[signingActions.globalName] = signingActions.transfer;
  signTx(transaction, options);
  return { transaction, options };
};

export const sendNativeCoin = ({ value, to }, networkAddress) => {
  const transaction = {
    to: getCurrentICONexNetwork().BSHAddress,
    value,
  };

  const options = {
    builder: new CallTransactionBuilder(),
    method: 'transferNativeCoin',
    params: {
      _to: `btp://${networkAddress}/${to}`,
    },
  };

  signTx(transaction, options);
  return { transaction, options };
};

/**
 * Claim token which was failed to refunded automatically
 * @param {object} payload
 */
export const reclaim = async ({ coinName, value }) => {
  const transaction = {
    to: getCurrentICONexNetwork().BSHAddress,
  };

  const options = {
    builder: new CallTransactionBuilder(),
    method: 'reclaim',
    params: {
      _coinName: coinName,
      _value: IconService.IconConverter.toHex(convertToLoopUnit(value)),
    },
  };

  signTx(transaction, options);
};

/**
 * DEPRECATED: Place a bid for token
 * @param {string} auctionName
 * @param {number} value
 * @param {string} fas FAS address
 */
export const placeBid = (auctionName, value, fas) => {
  const transaction = {
    to: fas || 'cxe3d36b26abbe6e1005eacf7e1111d5fefbdbdcad', // default FAS addess to our server
    value,
  };

  const options = {
    builder: new CallTransactionBuilder(),
    method: 'bid',
    params: {
      _tokenName: auctionName,
    },
  };

  window[signingActions.globalName] = signingActions.bid;
  signTx(transaction, options);
};

/**
 * Request ICON wallet to sign a transaction
 * @param {object} transaction
 * @param {onject} options
 */
export const signTx = (transaction = {}, options = {}) => {
  const { from = localStorage.getItem(ADDRESS_LOCAL_STORAGE), to, value } = transaction;
  const { method, params, builder, nid, timestamp } = options;

  if (!modal.isICONexWalletConnected()) {
    return;
  }

  modal.openModal({
    icon: 'loader',
    desc: 'Waiting for confirmation in your wallet.',
  });

  const txBuilder = builder || new IcxTransactionBuilder();

  let tx = txBuilder
    .from(from)
    .to(to)
    .stepLimit(IconService.IconConverter.toBigNumber(getCurrentICONexNetwork().stepLimit))
    .nid(IconService.IconConverter.toBigNumber(nid || getCurrentICONexNetwork().nid))
    .nonce(IconService.IconConverter.toBigNumber(1))
    .version(IconService.IconConverter.toBigNumber(3))
    .timestamp(timestamp || new Date().getTime() * 1000);

  if (value) {
    tx = tx.value(convertToLoopUnit(value));
  }

  if (method) {
    tx = tx.method(method).params(params);
  }

  tx = tx.build();

  const rawTx = IconService.IconConverter.toRawTransaction(tx);

  window[rawTransaction] = rawTx;
  const transactionHash = serialize(rawTx);

  requestSigning({
    from,
    hash: transactionHash,
  });

  return transactionHash;
};

/**
 * Returns BTP fee
 * @return {string} unit: 1/10000
 * ref: https://github.com/icon-project/btp/blob/iconloop/javascore/nativecoin/src/main/java/foundation/icon/btp/nativecoin/NativeCoinService.java#L40
 */
export const getBTPfee = async () => {
  const fee = await makeICXCall({
    to: getCurrentICONexNetwork().BSHAddress,
    dataType: 'call',
    data: {
      method: 'feeRatio',
    },
  });

  return IconService.IconConverter.toNumber(fee);
};

/**
 * Get BSH address of non-native token
 * In ICON network, every non-native token has their own BSH address
 * @param {string} coinName Token's name, ex: ICX, DEV,
 * @returns {string} BSH address corresponding to the coinName
 */
export const getBSHAddressOfCoinName = async coinName => {
  try {
    const payload = {
      dataType: 'call',
      to: getCurrentICONexNetwork().BSHAddress,
      data: {
        method: 'coinAddress',
        params: {
          _coinName: coinName,
        },
      },
    };

    return await makeICXCall(payload);
  } catch (err) {
    console.log('getBSHAddressOfCoinName err', err);
  }
};

/**
 * Get balance of non-native token
 * @param {object} payload
 * @returns {string} non-native token balance or refundable balance in a user-friendly format
 */
export const getBalanceOf = async ({ address, refundable = false, symbol = 'DEV' }) => {
  try {
    const bshAddressToken = await getBSHAddressOfCoinName(symbol);

    const payload = {
      dataType: 'call',
      to: bshAddressToken,
      data: {
        method: 'balanceOf',
        params: {
          _owner: address,
        },
      },
    };

    if (refundable) {
      payload.to = getCurrentICONexNetwork().BSHAddress;
      payload.data.params._coinName = symbol;
    }

    const balance = await makeICXCall(payload);

    return refundable ? convertToICX(balance.refundable) : roundNumber(ethers.utils.formatEther(balance), 6);
  } catch (err) {
    console.log('getBalanceOf err', err);
  }
};

/**
 * Set approval for sending BNB
 * @param {object} tx
 */
export const depositTokensIntoBSH = tx => {
  const transaction = {
    to: getCurrentICONexNetwork().irc2token,
  };

  const options = {
    builder: new CallTransactionBuilder(),
    method: 'transfer',
    params: {
      _to: getCurrentICONexNetwork().TOKEN_BSH_ADDRESS,
      _value: IconService.IconConverter.toHex(convertToLoopUnit(tx.value)),
    },
  };

  window[signingActions.receiver] = tx.to;
  window[signingActions.globalName] = signingActions.deposit;
  signTx(transaction, options);
};

/**
 * Send BNB which was approved
 */
export const sendNoneNativeCoinBSC = () => {
  const transaction = {
    to: getCurrentICONexNetwork().TOKEN_BSH_ADDRESS,
  };

  const options = {
    builder: new CallTransactionBuilder(),
    method: 'transfer',
    params: {
      tokenName: 'ETH',
      to: `btp://${BSC_NODE.networkAddress}/${window[signingActions.receiver]}`,
      value: window[rawTransaction].data.params._value,
    },
  };

  window[signingActions.globalName] = signingActions.transfer;
  signTx(transaction, options);
};
