import { MOON_BEAM_NODE, getCurrentICONexNetwork, signingActions, rawTransaction } from 'btp/src/connectors/constants';
import { convertToICX } from 'btp/src/connectors/ICONex/utils';
import { EthereumInstance } from 'btp/src/connectors/MetaMask';
import { roundNumber } from 'btp/src/utils/app';
import { connectedNetWorks } from 'btp/src/utils/constants';
import { ethers } from 'ethers';

import { toChecksumAddress } from '../utils';

export const serviceName = connectedNetWorks.moonbeam;

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
  const data = EthereumInstance.ABI.encodeFunctionData('reclaim', [coinName, value]);

  await EthereumInstance.sendTransaction({
    from: EthereumInstance.ethereum.selectedAddress,
    to: MOON_BEAM_NODE.BSHCore,
    gas: MOON_BEAM_NODE.gasLimit,
    data,
  });
};

export const transfer = async (tx, sendNativeCoin) => {
  // https://docs.metamask.io/guide/sending-transactions.html#example
  const value = ethers.utils.parseEther(tx.value)._hex;
  const { to } = tx;
  let txParams = {
    from: toChecksumAddress(EthereumInstance.ethereum.selectedAddress),
    value,
  };

  let data = null;
  if (sendNativeCoin) {
    data = EthereumInstance.ABI.encodeFunctionData('transferNativeCoin', [
      `btp://${getCurrentICONexNetwork().networkAddress}/${to}`,
    ]);
    txParams = {
      ...txParams,
      to: MOON_BEAM_NODE.BSHCore,
    };
  } else {
    window[rawTransaction] = tx;
    window[signingActions.globalName] = signingActions.approve;
    data = EthereumInstance.ABI.encodeFunctionData('approve', [MOON_BEAM_NODE.BSHCore, value]);
    txParams = {
      ...txParams,
      to: MOON_BEAM_NODE.BSHICX,
    };
    delete txParams.value;
  }

  txParams = {
    ...txParams,
    gas: MOON_BEAM_NODE.gasLimit,
    data,
  };

  await EthereumInstance.sendTransaction(txParams);
};

export const sendNoneNativeCoin = async () => {
  const data = EthereumInstance.ABI.encodeFunctionData('transfer', [
    'ICX',
    ethers.utils.parseEther(window[rawTransaction].value)._hex,
    `btp://${getCurrentICONexNetwork().networkAddress}/${window[rawTransaction].to}`,
  ]);

  window[signingActions.globalName] = signingActions.transfer;

  await EthereumInstance.sendTransaction({
    from: EthereumInstance.ethereum.selectedAddress,
    to: MOON_BEAM_NODE.BSHCore,
    gas: MOON_BEAM_NODE.gasLimit,
    data,
  });
};
