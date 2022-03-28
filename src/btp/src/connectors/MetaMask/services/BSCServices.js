import {
  MOON_BEAM_NODE,
  BSC_NODE,
  getCurrentICONexNetwork,
  signingActions,
  rawTransaction,
} from 'btp/src/connectors/constants';
import { convertToICX } from 'btp/src/connectors/ICONex/utils';
import { EthereumInstance } from 'btp/src/connectors/MetaMask';
import { toChecksumAddress } from 'btp/src/connectors/MetaMask/utils';
import { roundNumber } from 'btp/src/utils/app';
import { connectedNetWorks } from 'btp/src/utils/constants';
import { ethers } from 'ethers';

export const serviceName = connectedNetWorks.bsc;

export const getBalanceOf = async ({ address, symbol }) => {
  let balance = 0;

  // get ETH balance (ERC20 contract)
  if (symbol === 'ETH') {
    balance = await EthereumInstance.contractBEP20TKN_BSC.balanceOf(address);
  } else {
    balance = await EthereumInstance.contract_BSC.getBalanceOf(address, symbol);
  }

  return roundNumber(convertToICX(balance._hex || balance[0]._hex), 6);
};

export const transferNativeCoin = async (tx = {}) => {
  const value = ethers.utils.parseEther(tx.value || '1')._hex;

  const data = EthereumInstance.ABI.encodeFunctionData('transferNativeCoin', [
    `btp://${getCurrentICONexNetwork().networkAddress}/${tx.to}`,
  ]);

  const txParams = {
    from: toChecksumAddress(EthereumInstance.ethereum.selectedAddress),
    value,
    gas: MOON_BEAM_NODE.gasLimit,
    data,
  };

  await EthereumInstance.sendTransaction(txParams);
};

export const approve = async tx => {
  const data = EthereumInstance.ABI.encodeFunctionData('approve', [
    BSC_NODE.tokenBSHProxy,
    ethers.utils.parseEther(tx.value)._hex,
  ]);

  window[rawTransaction] = tx;
  window[signingActions.globalName] = signingActions.deposit;

  await EthereumInstance.sendTransaction({
    from: EthereumInstance.ethereum.selectedAddress,
    to: BSC_NODE.BEP20TKN,
    data,
  });
};

export const transfer = (tx, isSendingNativeCoin) => {
  if (isSendingNativeCoin) {
    transferNativeCoin(tx);
  } else {
    approve(tx);
  }
};

export const sendNoneNativeCoinBSC = async () => {
  const data = EthereumInstance.ABI.encodeFunctionData('transfer', [
    'ETH',
    ethers.utils.parseEther(window[rawTransaction].value)._hex,
    `btp://${getCurrentICONexNetwork().networkAddress}/${window[rawTransaction].to}`,
  ]);

  window[signingActions.globalName] = signingActions.transfer;
  await EthereumInstance.sendTransaction({
    from: EthereumInstance.ethereum.selectedAddress,
    to: BSC_NODE.tokenBSHProxy,
    gas: MOON_BEAM_NODE.gasLimit,
    data,
  });
};

export const reclaim = () => {
  console.log('Not implemented yet');
};
