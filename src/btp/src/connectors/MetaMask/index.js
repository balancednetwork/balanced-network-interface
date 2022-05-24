import React from 'react';

import { t } from '@lingui/macro';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';

import {
  NotificationPending,
  NotificationError,
  NotificationSuccess,
} from '../../../../app/components/Notification/TransactionNotification';
import { transferAssetMessage } from '../../../../app/components/trade/utils';
import { wallets } from '../../utils/constants';
import { chainList, customzeChain } from '../chainConfigs';
import { ADDRESS_LOCAL_STORAGE, CONNECTED_WALLET_LOCAL_STORAGE, signingActions, transactionInfo } from '../constants';
import { ABI } from './ABI';
import { sendNoneNativeCoin } from './services';
import { toChecksumAddress } from './utils';

const metamaskURL = 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';

class Ethereum {
  constructor() {
    this.ethereum = window.ethereum;
    this.provider = this.ethereum && new ethers.providers.Web3Provider(this.ethereum);
    this.ABI = new ethers.utils.Interface(ABI);
    this.contract = null;
    this.BEP20Contract = null;
    this.PROXYContract = null;
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
    if (
      this.ethereum.chainId &&
      !chainList.map(chain => chain.NETWORK_ADDRESS?.split('.')[0]).includes(this.ethereum.chainId)
    ) {
      // modal.openModal({
      //   desc:
      //     'The connected wallet is conflicted with your Source or Destination blockchain. Please change your blockchain option or reconnect a new wallet.',
      //   button: {
      //     text: 'Okay',
      //     onClick: () => modal.setDisplay(false),
      //   },
      // });
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
    try {
      this.getEthereum.on('chainChanged', chainId => {
        console.log('Change Network', chainId);
        window.location.reload();
      });
    } catch (err) {
      console.log(err);
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
        const currentNetwork = chainList.find(chain => chain.NETWORK_ADDRESS.startsWith(this.getEthereum.chainId));

        if (!currentNetwork) throw new Error('not found chain config');

        const { CHAIN_NAME, id, COIN_SYMBOL, BSH_CORE, BEP20, BSH_PROXY } = currentNetwork;

        this.contract = new ethers.Contract(BSH_CORE, ABI, this.provider);
        if (BEP20 && BSH_PROXY) {
          this.BEP20Contract = new ethers.Contract(BEP20, ABI, this.provider);
          this.PROXYContract = new ethers.Contract(BSH_PROXY, ABI, this.provider);
        }

        customzeChain(id);
        const accountInfo = {
          address,
          balance: ethers.utils.formatEther(balance),
          wallet,
          symbol: COIN_SYMBOL,
          currentNetwork: CHAIN_NAME,
          id,
        };
        window.accountInfo = accountInfo;
        console.log(window.accountInfo);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async refreshBalance() {
    const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);
    const balance = await this.getProvider.getBalance(address);

    window.accountInfo.balance = ethers.utils.formatEther(balance);
  }

  async sendTransaction(txParams) {
    try {
      // modal.openModal({
      //   icon: 'loader',
      //   desc: 'Waiting for confirmation in your wallet.',
      // });
      debugger;

      const transInfo = window[transactionInfo];
      let message = null;
      transInfo &&
        (message = transferAssetMessage(transInfo.value, transInfo.coinName, transInfo.to, transInfo.networkDst));
      const txHash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [txParams],
      });
      let link = '';

      transInfo.networkSrc === 'BSC'
        ? (link = `https://testnet.bscscan.com/tx/${txHash}`)
        : (link = `https://explorer.pops.one/tx/${txHash}`);

      toast(<NotificationPending summary={message.pendingMessage || t`Processing transaction...`} />, {
        onClick: () => window.open(link, '_blank'),
        toastId: txHash,
        autoClose: 10000,
      });

      let result = null;
      const checkTxRs = setInterval(async () => {
        if (result) {
          if (result.status === 1) {
            switch (window[signingActions.globalName]) {
              case signingActions.approve:
                // modal.openModal({
                //   icon: 'checkIcon',
                //   desc: `You've approved to tranfer your token! Please click the Transfer button to continue.`,
                //   button: {
                //     text: 'Transfer',
                //     onClick: sendNoneNativeCoin,
                //   },
                // });
                console.log("You've approved to tranfer your token! Please click the Transfer button to continue.");
                break;

              default:
                this.refreshBalance();
                // sendLog({
                //   txHash,
                //   network: getCurrentChain()?.NETWORK_ADDRESS?.split('.')[0],
                // });

                // modal.openModal({
                //   icon: 'checkIcon',
                //   children: <SuccessSubmittedTxContent />,
                //   button: {
                //     text: 'Continue transfer',
                //     onClick: () => {
                //       // back to transfer box
                //       resetTransferStep();
                //       modal.setDisplay(false);
                //     },
                //   },
                // });
                toast(<NotificationSuccess summary={message.successMessage || t`Transfer Success!`} />, {
                  onClick: () => window.open(process, '_blank'),
                  toastId: txHash,
                  autoClose: 5000,
                });
                console.log('Transfer Success');
                break;
            }
          } else {
            clearInterval(checkTxRs);
            // modal.openModal({
            //   icon: 'xIcon',
            //   desc: 'Transaction failed',
            //   button: {
            //     text: 'Back to transfer',
            //     onClick: () => modal.setDisplay(false),
            //   },
            // });
            toast(<NotificationError summary={message.failureMessage || t`Transaction failed!`} />, {
              onClick: () => window.open(link, '_blank'),
              toastId: txHash,
              autoClose: 5000,
            });
            console.log('Transaction failed');
          }

          clearInterval(checkTxRs);
        } else {
          result = await this.provider.getTransactionReceipt(txHash);
        }
      }, 4000);
    } catch (error) {
      if (error.code === 4001) {
        // modal.openModal({
        //   icon: 'exclamationPointIcon',
        //   desc: 'Transaction rejected.',
        //   button: {
        //     text: 'Dismiss',
        //     onClick: () => modal.setDisplay(false),
        //   },
        // });
        console.log('Transaction rejected.');
        return;
      } else {
        // modal.openModal({
        //   icon: 'xIcon',
        //   desc: error.message,
        //   button: {
        //     text: 'Back to transfer',
        //     onClick: () => modal.setDisplay(false),
        //   },
        // });
        console.log(error.message);
      }
    }
  }
}

const EthereumInstance = new Ethereum();
EthereumInstance.chainChangedListener();

export { EthereumInstance };
