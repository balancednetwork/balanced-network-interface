import { ethers } from 'ethers';

import { EthereumInstance } from '.';
import { roundNumber } from '../../utils/app';
import { chainConfigs, formatSymbol } from '../chainConfigs';
import { signingActions, rawTransaction, getCurrentChain } from '../constants';
import { convertToICX } from '../ICONex/utils';
import { ABI } from './ABI';
import { ABIOfToken } from './ABIOfToken';
import { toChecksumAddress } from './utils';

const ICONchain = chainConfigs.ICON || {};

export const getBalanceOf = async ({ address, refundable = false, symbol = 'ICX' }) => {
  try {
    let balance = 0;
    const fSymbol = formatSymbol(symbol);

    if (refundable) {
      balance = await new ethers.Contract(getCurrentChain().BTS_CORE, ABI, EthereumInstance.provider).balanceOf(
        address,
        fSymbol,
      );
    } else {
      balance = await new ethers.Contract(await getCoinId(fSymbol), ABIOfToken, EthereumInstance.provider).balanceOf(
        address,
      );
    }

    return roundNumber(convertToICX(refundable ? balance._refundableBalance._hex : balance._hex || balance[0]._hex), 6);
  } catch (err) {
    console.error('Err: ', err);
    return 0;
  }
};

export const getCoinId = async coinName => {
  try {
    return await EthereumInstance.contract.coinId(coinName);
  } catch (err) {
    console.error('Err: ', err);
  }
};

export const reclaim = async ({ coinName, value }) => {
  const { BTS_CORE, GAS_LIMIT } = getCurrentChain();

  const data = EthereumInstance.ABI.encodeFunctionData('reclaim', [coinName, value]);

  await EthereumInstance.sendTransaction({
    from: EthereumInstance.ethereum.selectedAddress,
    to: BTS_CORE,
    gas: GAS_LIMIT,
    data,
  });
};

export const approve = async (tx, token) => {
  const symbol = window['accountInfo'].symbol;
  const isSendingNativeCoin = symbol === token;
  const { BTS_CORE } = getCurrentChain();
  const { to } = tx;
  const value = ethers.utils.parseEther(tx.value)._hex;
  let data = null;
  if (isSendingNativeCoin) {
    window[signingActions.globalName] = signingActions.transfer;
    data = await EthereumInstance.ABI.encodeFunctionData('transferNativeCoin', [
      `btp://${ICONchain.NETWORK_ADDRESS}/${to}`,
    ]);
  } else {
    window[rawTransaction] = tx;
    window[signingActions.globalName] = signingActions.approve;
    data = await EthereumInstance.ABI.encodeFunctionData('approve', [BTS_CORE, value]);
  }
  return data;
};

export const transfer = async (tx, token, isApproved) => {
  const { BTS_CORE, GAS_LIMIT } = getCurrentChain();
  const symbol = window['accountInfo'].symbol;
  const isSendingNativeCoin = symbol === token;
  // https://docs.metamask.io/guide/sending-transactions.html#example
  const value = ethers.utils.parseEther(tx.value)._hex;
  let txParams = {
    from: toChecksumAddress(EthereumInstance.ethereum.selectedAddress),
    value,
  };

  let data = null;
  if (isSendingNativeCoin) {
    data = await approve(tx, token);
    txParams = {
      ...txParams,
      to: BTS_CORE,
    };
  } else {
    if (!isApproved) {
      //handle error
      return;
    }
    txParams = {
      ...txParams,
      to: await getCoinId(formatSymbol(token)),
    };
    delete txParams.value;
  }

  txParams = {
    ...txParams,
    gas: GAS_LIMIT,
    data,
  };

  await EthereumInstance.sendTransaction(txParams);
  return txParams;
};

export const sendNoneNativeCoin = async () => {
  const { BTS_CORE, GAS_LIMIT } = getCurrentChain();

  const { value, to, coinName } = window[rawTransaction];
  const hexValue = ethers.utils.parseEther(value)._hex;

  const data = EthereumInstance.ABI.encodeFunctionData('transfer', [
    formatSymbol(coinName),
    hexValue,
    `btp://${ICONchain.NETWORK_ADDRESS}/${to}`,
  ]);

  window[signingActions.globalName] = signingActions.transfer;
  const params = {
    from: EthereumInstance.ethereum.selectedAddress,
    to: BTS_CORE,
    gas: GAS_LIMIT,
    data,
  };

  await EthereumInstance.sendTransaction(params);
  return params;
};
