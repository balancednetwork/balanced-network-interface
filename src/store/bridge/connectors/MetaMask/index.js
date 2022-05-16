import React from 'react';

import { ethers } from 'ethers';

// import { SuccessSubmittedTxContent } from 'btp/src/components/NotificationModal/SuccessSubmittedTxContent';
import store from '../../store';
import { wallets, nativeTokens } from '../../utils/constants';
import {
  ADDRESS_LOCAL_STORAGE,
  ACCOUNT_INFO,
  allowedNetworkIDs,
  BSC_NODE,
  CONNECTED_WALLET_LOCAL_STORAGE,
  MOON_BEAM_NODE,
  signingActions,
} from '../constants';
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
    console.log(this.isMetaMaskInstalled());
    if (!this.isMetaMaskInstalled()) {
      console.log('2');
      localStorage.removeItem(CONNECTED_WALLET_LOCAL_STORAGE);
      window.open(metamaskURL);
      return;
    }
    try {
      const isAllowedNetwork = this.isAllowedNetwork();
      console.log('isAllowedNetwork', isAllowedNetwork);
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
    console.log('222');
    try {
      console.log('111');
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
        const accountInfo = {
          accounts,
          address,
          balance: ethers.utils.formatEther(balance),
          wallet,
          unit: nativeTokens[currentNetwork].symbol,
          currentNetwork,
        };
        localStorage.setItem(ACCOUNT_INFO, JSON.stringify(accountInfo));
      }
    } catch (error) {
      console.log(error);
    }
  }

  async sendTransaction(txParams) {
    try {
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
                break;
              case signingActions.approve:
                break;

              default:
                this.getEthereumAccounts();

                break;
            }
          } else {
            clearInterval(checkTxRs);
          }

          clearInterval(checkTxRs);
        } else {
          result = await this.provider.getTransactionReceipt(txHash);
        }
      }, 4000);
    } catch (error) {
      if (error.code === 4001) {
        return;
      } else {
      }
    }
  }
}

const EthereumInstance = new Ethereum();
EthereumInstance.chainChangedListener();

export { EthereumInstance };
