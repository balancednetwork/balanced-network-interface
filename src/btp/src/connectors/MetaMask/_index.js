import { SuccessSubmittedTxContent } from 'components/NotificationModal/SuccessSubmittedTxContent';
import { chainList, customzeChain } from 'connectors/chainConfigs';
import { ADDRESS_LOCAL_STORAGE, CONNECTED_WALLET_LOCAL_STORAGE, signingActions } from 'connectors/constants';
import { resetTransferStep } from 'connectors/ICONex/utils';
import { sendNoneNativeCoin } from 'connectors/MetaMask/services';
import { ethers } from 'ethers';

import store from 'store';
import { wallets } from 'utils/constants';

import { ABI } from './ABI';
import { toChecksumAddress } from './utils';

const { modal, account } = store.dispatch;

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

  isAllowedNetwork() {
    if (
      this.ethereum.chainId &&
      !chainList.map(chain => chain.NETWORK_ADDRESS?.split('.')[0]).includes(this.ethereum.chainId)
    ) {
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

        const { CHAIN_NAME, id, COIN_SYMBOL, BSH_CORE } = currentNetwork;

        this.contract = new ethers.Contract(BSH_CORE, ABI, this.provider);
        customzeChain(id);
        account.setAccountInfo({
          address,
          balance: ethers.utils.formatEther(balance),
          wallet,
          unit: COIN_SYMBOL,
          currentNetwork: CHAIN_NAME,
          id: id,
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
            text: 'Dismiss',
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
