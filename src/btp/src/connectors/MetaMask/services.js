import { ethers } from 'ethers';

import { EthereumInstance } from '.';
import { roundNumber } from '../../utils/app';
import { chainConfigs, formatSymbol } from '../chainConfigs';
import { SIGNING_ACTIONS, rawTransaction, getCurrentChain } from '../constants';
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
    console.error('getBalanceOf err: ', err);
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

  return EthereumInstance.sendTransaction({
    from: EthereumInstance.ethereum.selectedAddress,
    to: BTS_CORE,
    gas: GAS_LIMIT,
    data,
  });
};

export const transfer = async (tx, sendNativeCoin, token) => {
  const { BTS_CORE, GAS_LIMIT } = getCurrentChain();
  console.log('🚀 ~ file: services.js:60 ~ transfer ~ GAS_LIMIT:', GAS_LIMIT);

  // https://docs.metamask.io/guide/sending-transactions.html#example
  const value = ethers.utils.parseEther(tx.value)._hex;
  const { to } = tx;
  let txParams = {
    from: toChecksumAddress(EthereumInstance.ethereum.selectedAddress),
    value,
  };

  let data = null;
  if (sendNativeCoin) {
    window[SIGNING_ACTIONS.GLOBAL_NAME] = SIGNING_ACTIONS.TRANSFER;

    data = EthereumInstance.ABI.encodeFunctionData('transferNativeCoin', [`btp://${ICONchain.NETWORK_ADDRESS}/${to}`]);
    txParams = {
      ...txParams,
      to: BTS_CORE,
    };
  } else {
    window[rawTransaction] = tx;
    window[SIGNING_ACTIONS.GLOBAL_NAME] = SIGNING_ACTIONS.APPROVE;

    data = EthereumInstance.ABI.encodeFunctionData('approve', [BTS_CORE, value]);

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

  return EthereumInstance.sendTransaction(txParams);
  // return txParams;
};

export const sendNonNativeCoin = async tx => {
  const { BTS_CORE, GAS_LIMIT } = getCurrentChain();

  const { value, to, coinName } = tx || window[rawTransaction];
  const hexValue = ethers.utils.parseEther(value)._hex;

  const data = EthereumInstance.ABI.encodeFunctionData('transfer', [
    formatSymbol(coinName),
    hexValue,
    `btp://${ICONchain.NETWORK_ADDRESS}/${to}`,
  ]);

  window[SIGNING_ACTIONS.GLOBAL_NAME] = SIGNING_ACTIONS.TRANSFER;
  const params = {
    from: EthereumInstance.ethereum.selectedAddress,
    to: BTS_CORE,
    gas: GAS_LIMIT,
    data,
  };

  return EthereumInstance.sendTransaction(params);
  // return params;
};
