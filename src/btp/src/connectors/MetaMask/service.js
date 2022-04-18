import { chainConfigs } from 'connectors/chainConfigs';
import { signingActions, rawTransaction, getCurrentChain } from 'connectors/constants';
import { convertToICX } from 'connectors/ICONex/utils';
import { EthereumInstance } from 'connectors/MetaMask';
import { ethers } from 'ethers';

import { roundNumber } from 'utils/app';

import { toChecksumAddress } from './utils';

export const serviceName = 'TODO';
const ICONchain = chainConfigs.ICON || {};

export const getBalanceOf = async ({ address, refundable = false, symbol = 'ICX' }) => {
  try {
    const balance = await EthereumInstance.contract.getBalanceOf(address, symbol);
    return refundable ? convertToICX(balance._refundableBalance._hex) : roundNumber(convertToICX(balance[0]._hex), 6);
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
    data = EthereumInstance.ABI.encodeFunctionData(
      approve.newName || 'approve',
      approve.params ? approve.params({ amount: value, coinName: token }) : [BSH_CORE, value],
    );
    txParams = {
      ...txParams,
      to: getCurrentChain()['BSH_' + token],
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
    GAS_LIMIT,
    methods: { transfer = {} },
  } = getCurrentChain();

  const hexValue = ethers.utils.parseEther(window[rawTransaction].value)._hex;

  const data = EthereumInstance.ABI.encodeFunctionData(
    transfer.newName || 'transfer',
    transfer.params
      ? transfer.params({
          amount: hexValue,
          recipientAddress: window[rawTransaction].to,
        })
      : // TODO: remove hard-coded ICX
        ['ICX', hexValue, `btp://${ICONchain.NETWORK_ADDRESS}/${window[rawTransaction].to}`],
  );

  window[signingActions.globalName] = signingActions.transfer;

  await EthereumInstance.sendTransaction({
    from: EthereumInstance.ethereum.selectedAddress,
    to: BSH_CORE,
    gas: GAS_LIMIT,
    data,
  });
};
