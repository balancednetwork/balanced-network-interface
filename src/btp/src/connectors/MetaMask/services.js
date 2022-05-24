import { ethers } from 'ethers';

import { EthereumInstance } from '.';
import { roundNumber } from '../../utils/app';
import { chainConfigs, checkIsToken } from '../chainConfigs';
import { signingActions, rawTransaction, getCurrentChain } from '../constants';
import { convertToICX } from '../ICONex/utils';
import { toChecksumAddress } from './utils';

const ICONchain = chainConfigs.ICON || {};

export const getBalanceOf = async ({ address, refundable = false, symbol = 'ICX', isToken }) => {
  try {
    let balance = 0;
    // ETH is the only one ERC20 token so far, others are coin.
    if (isToken) {
      balance = await EthereumInstance.BEP20Contract.balanceOf(address);
    } else {
      balance = await EthereumInstance.contract.getBalanceOf(address, symbol);
    }

    return refundable
      ? convertToICX(balance._refundableBalance._hex)
      : roundNumber(convertToICX(balance._hex || balance[0]._hex), 6);
  } catch (err) {
    console.log('Err: ', err);
    return 0;
  }
};

export const reclaim = async ({ coinName, value }) => {
  const {
    BSH_CORE,
    GAS_LIMIT,
    methods: { reclaim = {} },
  } = getCurrentChain();

  const data = EthereumInstance.ABI.encodeFunctionData(
    reclaim.newName || 'reclaim',
    reclaim.params ? reclaim.params({ amount: value, coinName }) : [coinName, value],
  );

  await EthereumInstance.sendTransaction({
    from: EthereumInstance.ethereum.selectedAddress,
    to: BSH_CORE,
    gas: GAS_LIMIT,
    data,
  });
};

export const transfer = async (tx, sendNativeCoin, token) => {
  const {
    BSH_CORE,
    BSH_PROXY,
    BEP20,
    GAS_LIMIT,
    methods: { transferNativeCoin = {}, approve = {} },
  } = getCurrentChain();

  // https://docs.metamask.io/guide/sending-transactions.html#example
  const value = ethers.utils.parseEther(tx.value)._hex;
  const { to } = tx;
  let txParams = {
    from: toChecksumAddress(EthereumInstance.ethereum.selectedAddress),
    value,
  };

  let data = null;
  if (sendNativeCoin) {
    data = EthereumInstance.ABI.encodeFunctionData(
      transferNativeCoin.newName || 'transferNativeCoin',
      transferNativeCoin.params
        ? transferNativeCoin.params({ amount: value, coinName: token, recipientAddress: to })
        : [`btp://${ICONchain.NETWORK_ADDRESS}/${to}`],
    );
    txParams = {
      ...txParams,
      to: BSH_CORE,
    };
  } else {
    window[rawTransaction] = tx;
    window[signingActions.globalName] = signingActions.approve;
    const isToken = checkIsToken(token);

    data = EthereumInstance.ABI.encodeFunctionData(
      approve.newName || 'approve',
      approve.params ? approve.params({ amount: value, coinName: token }) : [isToken ? BSH_PROXY : BSH_CORE, value],
    );

    txParams = {
      ...txParams,
      to: isToken ? BEP20 : getCurrentChain()['BSH_' + token],
    };
    delete txParams.value;
  }

  txParams = {
    ...txParams,
    gas: GAS_LIMIT,
    data,
  };

  await EthereumInstance.sendTransaction(txParams);
};

export const sendNoneNativeCoin = async () => {
  const {
    BSH_CORE,
    BSH_PROXY,
    GAS_LIMIT,
    methods: { transfer = {} },
  } = getCurrentChain();

  const { value, to, coinName } = window[rawTransaction];
  const hexValue = ethers.utils.parseEther(value)._hex;

  const data = EthereumInstance.ABI.encodeFunctionData(
    transfer.newName || 'transfer',
    transfer.params
      ? transfer.params({
          amount: hexValue,
          recipientAddress: to,
        })
      : [coinName, hexValue, `btp://${ICONchain.NETWORK_ADDRESS}/${to}`],
  );

  window[signingActions.globalName] = signingActions.transfer;

  await EthereumInstance.sendTransaction({
    from: EthereumInstance.ethereum.selectedAddress,
    to: checkIsToken(coinName) ? BSH_PROXY : BSH_CORE,
    gas: GAS_LIMIT,
    data,
  });
};
