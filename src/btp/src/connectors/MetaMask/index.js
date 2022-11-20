import React from 'react';

import { SupportedChainId } from '@balancednetwork/balanced-js';
import { t } from '@lingui/macro';
import { ethers, utils } from 'ethers';
import { toast } from 'react-toastify';

import {
  NotificationPending,
  NotificationError,
  NotificationSuccess,
} from '../../../../app/components/Notification/TransactionNotification';
import { wallets } from '../../utils/constants';
import { chainConfigs, chainList } from '../chainConfigs';
import { ADDRESS_LOCAL_STORAGE, CONNECTED_WALLET_LOCAL_STORAGE, signingActions, transactionInfo } from '../constants';
import { ABI } from './ABI';
import { findReplacementTx } from './findReplacementTx';
import { handleSuccessTx } from './handleNotification';
import { toChecksumAddress } from './utils';

const metamaskURL = 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';

class Ethereum {
  constructor() {
    this.ethereum = window.ethereum;
    this.provider = this.ethereum && new ethers.providers.Web3Provider(this.ethereum);
    this.ABI = new ethers.utils.Interface(ABI);
    this.contract = null;
  }

  get getEthereum() {
    if (!this.isMetaMaskInstalled()) {
      window.open(metamaskURL);
      throw new Error('MetaMask has not been installed');
    }
    return this.ethereum;
  }

  set setEthereum(value) {
    this.ethereum = value;
  }

  get getProvider() {
    if (!this.isMetaMaskInstalled()) {
      window.open(metamaskURL);
      throw new Error('MetaMask has not been installed');
    }
    return this.provider;
  }

  set setProvider(value) {
    this.provider = value;
  }

  isMetaMaskInstalled() {
    return Boolean(this.ethereum && this.ethereum.isMetaMask);
  }

  isMetaMaskConnected() {
    return this.ethereum && this.ethereum.isConnected();
  }

  async switchChainInMetamask() {
    const { NETWORK_ADDRESS, EXPLORE_URL, RPC_URL, COIN_SYMBOL, CHAIN_NAME } = chainConfigs['BSC'] || {}; // HARD CODE BSC HERE
    const chainId = NETWORK_ADDRESS?.split('.')[0];
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      return chainId;
    } catch (error) {
      // Error Code 4902 means the network we're trying to switch is not available so we have to add it first
      if (error.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId,
                chainName:
                  CHAIN_NAME +
                  ' ' +
                  (process.env.REACT_APP_NETWORK_ID === SupportedChainId.MAINNET.toString() ? 'Mainnet' : 'Testnet'),
                rpcUrls: [RPC_URL],
                // iconUrls: [logoUrl],
                blockExplorerUrls: [EXPLORE_URL],
                nativeCurrency: {
                  name: COIN_SYMBOL,
                  symbol: COIN_SYMBOL,
                  decimals: 18,
                },
              },
            ],
          });
          return chainId;
        } catch (error) {
          return false;
        }
      } else {
        return false;
      }
    }
  }

  isAllowedNetwork(chainId) {
    if (
      this.ethereum.chainId &&
      !chainList
        .map(chain => (chain.id === chainConfigs.ICON.id ? '' : chain.NETWORK_ADDRESS?.split('.')[0]))
        .includes(chainId || this.ethereum.chainId)
    ) {
      console.log(
        'The connected wallet is conflicted with your Source or Destination blockchain. Please change your blockchain option or reconnect a new wallet.',
      );
      window.accountInfo = null;
      return false;
    }
    return true;
  }

  async connectMetaMaskWallet() {
    if (!this.isMetaMaskInstalled()) {
      localStorage.removeItem(CONNECTED_WALLET_LOCAL_STORAGE);
      window.open(metamaskURL);
      return;
    }
    try {
      const chainId = await this.switchChainInMetamask();
      if (chainId) {
        await this.getEthereum.request({ method: 'eth_requestAccounts' });
      } else {
        window.accountInfo = null;
        return false;
      }

      return chainId;
    } catch (error) {
      console.log(error);
    }
  }

  chainChangedListener() {
    try {
      this.getEthereum.on('chainChanged', chainId => {
        console.log('Change Network', chainId);
        // window.location.reload();
      });
    } catch (err) {
      console.log(err);
    }
  }

  async getEthereumAccounts(chainId) {
    try {
      const accounts = await this.getEthereum.request({ method: 'eth_accounts' });
      const isAllowed = this.isAllowedNetwork();

      if (isAllowed) {
        const currentNetwork = chainList.find(chain =>
          chain.NETWORK_ADDRESS.startsWith(chainId || this.getEthereum.chainId),
        );

        if (!currentNetwork) throw new Error('not found chain config');

        const address = toChecksumAddress(accounts[0]);
        localStorage.setItem(ADDRESS_LOCAL_STORAGE, address);
        const balance = await this.getProvider.getBalance(address);
        const { CHAIN_NAME, id, COIN_SYMBOL, BTS_CORE } = currentNetwork;
        this.contract = new ethers.Contract(BTS_CORE, ABI, this.provider);
        const accountInfo = {
          address,
          balance: ethers.utils.formatEther(balance),
          wallet: wallets.metamask,
          symbol: COIN_SYMBOL,
          currentNetwork: CHAIN_NAME,
          id,
        };
        window.accountInfo = accountInfo;
        console.log(window.accountInfo);
      }
    } catch (error) {
      console.log(error);
      window.accountInfo = null;
    }
  }

  async refreshBalance() {
    const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);
    const balance = await this.getProvider.getBalance(address);

    window.accountInfo.balance = ethers.utils.formatEther(balance);
  }

  async sendTransaction(txParams) {
    try {
      const transInfo = window[transactionInfo];
      const gasPrice = utils.hexValue(Math.round((await this.provider.getGasPrice()) * 1.04));
      const txHash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ ...txParams, gasPrice }],
      });
      let txInPoolIntervalTrigger = await this.provider.getTransaction(txHash);
      let txInPoolData = null;

      const safeReorgHeight = (await this.getProvider.getBlockNumber()) - 20;
      let minedTx = null;
      let replacementTx = null;
      let link = '';
      const currentNetworkConfig = chainConfigs[transInfo.networkSrc];
      transInfo.networkSrc === 'BSC' &&
        (link = `${currentNetworkConfig.EXPLORE_URL}/${currentNetworkConfig.exploreSuffix?.transaction}/${txHash}`);
      // toast(<NotificationPending summary={message.pendingMessage || t`Processing transaction...`} />, {
      //   onClick: () => window.open(link, '_blank'),
      //   toastId: txHash,
      //   autoClose: 3000,
      // });

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

      // For checking replacement tx by speeding up or cancelling tx from MetaMask
      const checkTxRs = setInterval(async () => {
        if (txInPoolIntervalTrigger) {
          txInPoolData = txInPoolIntervalTrigger;
        }

        if (!txInPoolIntervalTrigger && !minedTx && !replacementTx) {
          if (!txInPoolData) {
            console.error('No current transaction information.');
            clearInterval(checkTxRs);
            return;
          }
          try {
            replacementTx = await findReplacementTx(this.provider, safeReorgHeight, {
              nonce: txInPoolData.nonce,
              from: txInPoolData.from,
              to: txInPoolData.to,
              data: txInPoolData.data,
            });
          } catch (error) {
            clearInterval(checkTxRs);

            toast(<NotificationError summary={error?.message || t`Transaction failed!`} />, {
              onClick: () => window.open(link, '_blank'),
              toastId: txHash,
              autoClose: 3000,
            });
          }
        } else {
          txInPoolIntervalTrigger = await this.provider.getTransaction(txHash);
        }

        if (replacementTx) {
          clearInterval(checkTxRs);
          // toast(<NotificationSuccess summary={message.successMessage || t`Transfer Success!`} />, {
          //   onClick: () => window.open(process, '_blank'),
          //   toastId: replacementTx.hash,
          //   autoClose: 3000,
          // });
          handleSuccessTx(replacementTx.hash);
          if (
            window[signingActions.globalName] === signingActions.approve ||
            window[signingActions.globalName] === signingActions.approveIRC2
          ) {
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
          } else {
            toast.update(txHash, {
              ...toastProps,
              render: <NotificationSuccess summary={transferMessage.successMessage || t`Successfully transfer!`} />,
              autoClose: 3000,
            });
          }
        }
      }, 3000);
      // Emitted when the transaction has been mined
      this.provider.once(txHash, transaction => {
        clearInterval(checkTxRs);
        minedTx = transaction;
        if (transaction.status === 1) {
          // toast(<NotificationSuccess summary={message.successMessage || t`Transfer Success!`} />, {
          //   onClick: () => window.open(process, '_blank'),
          //   toastId: txHash,
          //   autoClose: 3000,
          // });
          if (
            window[signingActions.globalName] === signingActions.approve ||
            window[signingActions.globalName] === signingActions.approveIRC2
          ) {
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
          } else {
            toast.update(txHash, {
              ...toastProps,
              render: <NotificationSuccess summary={transferMessage.successMessage || t`Successfully transfer!`} />,
              autoClose: 3000,
            });
          }
          handleSuccessTx(txHash);
        } else {
          // toast(<NotificationError summary={message.failureMessage || t`Transaction failed!`} />, {
          //   onClick: () => window.open(link, '_blank'),
          //   toastId: txHash,
          //   autoClose: 3000,
          // });
          if (
            window[signingActions.globalName] === signingActions.approve ||
            window[signingActions.globalName] === signingActions.approveIRC2
          ) {
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
          } else {
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
          }
        }
      });
    } catch (error) {
      console.log(error.message);
    }
  }
}

const EthereumInstance = new Ethereum();
EthereumInstance.chainChangedListener();

export { EthereumInstance };
