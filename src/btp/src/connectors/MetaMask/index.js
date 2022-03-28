import React from 'react';

import { SuccessSubmittedTxContent } from 'btp/src/components/NotificationModal/SuccessSubmittedTxContent';
import {
  ADDRESS_LOCAL_STORAGE,
  CONNECTED_WALLET_LOCAL_STORAGE,
  MOON_BEAM_NODE,
  BSC_NODE,
  allowedNetworkIDs,
  signingActions,
} from 'btp/src/connectors/constants';
import { resetTransferStep } from 'btp/src/connectors/ICONex/utils';
import { sendNoneNativeCoinBSC } from 'btp/src/connectors/MetaMask/services/BSCServices';
import { sendNoneNativeCoin } from 'btp/src/connectors/MetaMask/services/MoonbeamServices';
import store from 'btp/src/store';
import { wallets, nativeTokens } from 'btp/src/utils/constants';
import { ethers } from 'ethers';

import { ABI } from './abi/ABI';
import { toChecksumAddress } from './utils';

const { modal, account } = store.dispatch;

const metamaskURL = 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';

class Ethereum {
  constructor() {
    this.ethereum = window.ethereum;
    this.provider = this.ethereum && new ethers.providers.Web3Provider(this.ethereum);
    this.ABI = new ethers.utils.Interface(ABI);

    // Moonbeam
    this.contract = new ethers.Contract(MOON_BEAM_NODE.BSHCore, ABI, this.provider);
    // BSC
    this.contract_BSC = new ethers.Contract(BSC_NODE.BSHCore, ABI, this.provider);
    this.contractBEP20TKN_BSC = new ethers.Contract(BSC_NODE.BEP20TKN, ABI, this.provider);
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

  isAllowedNetwork() {
    if (this.ethereum.chainId && !Object.keys(allowedNetworkIDs.metamask).includes(this.ethereum.chainId)) {
      modal.openModal({
        desc:
          'The connected wallet is conflicted with your Source or Destination blockchain. Please change your blockchain option or reconnect a new wallet.',
        button: {
          text: 'Okay',
          onClick: () => modal.setDisplay(false),
        },
      });

      account.resetAccountInfo();
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
      const isAllowedNetwork = this.isAllowedNetwork();

      if (isAllowedNetwork) {
        await this.getEthereum.request({ method: 'eth_requestAccounts' });
        return true;
      }
    } catch (error) {
      console.log(error);
    }
  }

  chainChangedListener() {
    if (this.isMetaMaskConnected()) {
      this.getEthereum.on('chainChanged', chainId => {
        console.log('Change Network', chainId);
        window.location.reload();
      });
    }
  }

  async getEthereumAccounts() {
    try {
      const isAllowedNetwork = this.isAllowedNetwork();

      if (isAllowedNetwork) {
        const wallet = wallets.metamask;
        const accounts = await this.getEthereum.request({ method: 'eth_accounts' });
        const address = toChecksumAddress(accounts[0]);
        localStorage.setItem(ADDRESS_LOCAL_STORAGE, address);
        const balance = await this.getProvider.getBalance(address);
        const currentNetwork = allowedNetworkIDs.metamask[this.getEthereum.chainId];

        account.setAccountInfo({
          address,
          balance: ethers.utils.formatEther(balance),
          wallet,
          unit: nativeTokens[currentNetwork].symbol,
          currentNetwork,
        });
      }
    } catch (error) {
      console.log(error);
    }
  }

  async sendTransaction(txParams) {
    try {
      modal.openModal({
        icon: 'loader',
        desc: 'Waiting for confirmation in your wallet.',
      });

      const txHash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
      let result = null;

      const checkTxRs = setInterval(async () => {
        if (result) {
          if (result.status === 1) {
            switch (window[signingActions.globalName]) {
              case signingActions.deposit:
                modal.openModal({
                  icon: 'checkIcon',
                  desc: `You've deposited your tokens successfully! Please click the Transfer button to continue.`,
                  button: {
                    text: 'Transfer',
                    onClick: () => sendNoneNativeCoinBSC(),
                  },
                });
                break;
              case signingActions.approve:
                modal.openModal({
                  icon: 'checkIcon',
                  desc: `You've approved to tranfer your token! Please click the Transfer button to continue.`,
                  button: {
                    text: 'Transfer',
                    onClick: sendNoneNativeCoin,
                  },
                });
                break;

              default:
                this.getEthereumAccounts();

                modal.openModal({
                  icon: 'checkIcon',
                  children: <SuccessSubmittedTxContent />,
                  button: {
                    text: 'Continue transfer',
                    onClick: () => {
                      // back to transfer box
                      resetTransferStep();
                      modal.setDisplay(false);
                    },
                  },
                });
                break;
            }
          } else {
            clearInterval(checkTxRs);
            modal.openModal({
              icon: 'xIcon',
              desc: 'Transaction failed',
              button: {
                text: 'Back to transfer',
                onClick: () => modal.setDisplay(false),
              },
            });
          }

          clearInterval(checkTxRs);
        } else {
          result = await this.provider.getTransactionReceipt(txHash);
        }
      }, 4000);
    } catch (error) {
      if (error.code === 4001) {
        modal.openModal({
          icon: 'exclamationPointIcon',
          desc: 'Transaction rejected.',
          button: {
            text: 'Dissmiss',
            onClick: () => modal.setDisplay(false),
          },
        });
        return;
      } else {
        modal.openModal({
          icon: 'xIcon',
          desc: error.message,
          button: {
            text: 'Back to transfer',
            onClick: () => modal.setDisplay(false),
          },
        });
      }
    }
  }
}

const EthereumInstance = new Ethereum();
EthereumInstance.chainChangedListener();

export { EthereumInstance };
