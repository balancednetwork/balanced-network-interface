import { SupportedChainId } from '@balancednetwork/balanced-js';
import { t } from '@lingui/macro';
import { TransactionResponse } from 'btp/src/type/transaction';
import { ethers, utils } from 'ethers';
import { ToastOptions, UpdateOptions } from 'react-toastify';

import { TransactionStatus } from '../../../../store/transactions/hooks';
import { wallets } from '../../utils/constants';
import { chainConfigs, chainList, customzeChain } from '../chainConfigs';
import { ADDRESS_LOCAL_STORAGE, CONNECTED_WALLET_LOCAL_STORAGE, SIGNING_ACTIONS, transactionInfo } from '../constants';
import { getTransactionMessages, triggerSetAccountInfo } from '../helper';
import { resetTransferStep } from '../ICONex/utils';
import { openToast } from '../transactionToast';
import { ABI } from './ABI';
import { findReplacementTx } from './findReplacementTx';
import { toChecksumAddress } from './utils';

const metamaskURL = 'https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn';

class Ethereum {
  private ethereum: any;
  private provider: ethers.providers.Web3Provider;
  private ABI: ethers.utils.Interface;
  private contract: null | ethers.Contract;

  constructor() {
    this.ethereum = window['ethereum'];
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
      await window['ethereum']?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });
      return chainId;
    } catch (error: any) {
      // Error Code 4902 means the network we're trying to switch is not available so we have to add it first
      if (error.code === 4902) {
        try {
          await window['ethereum']?.request({
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

  isAllowedNetwork(chainId?: string) {
    if (
      this.ethereum.chainId &&
      !chainList
        .map(chain => (chain.id === chainConfigs.ICON.id ? '' : chain.NETWORK_ADDRESS?.split('.')[0]))
        .includes(chainId || this.ethereum.chainId)
    ) {
      console.log(
        'The connected wallet is conflicted with your Source or Destination blockchain. Please change your blockchain option or reconnect a new wallet.',
      );
      window['accountInfo'] = null;
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
        window['accountInfo'] = null;
        return false;
      }

      return chainId;
    } catch (error) {
      console.log(error);
    }
  }

  async getEthereumAccounts(chainId?: string) {
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
        customzeChain(id);
        const accountInfo = {
          address,
          balance: ethers.utils.formatEther(balance),
          wallet: wallets.metamask,
          symbol: COIN_SYMBOL,
          currentNetwork: CHAIN_NAME,
          id,
        };
        triggerSetAccountInfo(accountInfo);
      }
    } catch (error) {
      console.log(error);
      triggerSetAccountInfo(null);
    }
  }

  async refreshBalance() {
    const address = localStorage.getItem(ADDRESS_LOCAL_STORAGE);
    if (address !== null) {
      const balance = await this.getProvider.getBalance(address);
      triggerSetAccountInfo({ balance: ethers.utils.formatEther(balance) });
    }
  }

  handleSuccessTx() {
    if (window[SIGNING_ACTIONS.GLOBAL_NAME] !== SIGNING_ACTIONS.APPROVE) {
      this.refreshBalance();
      resetTransferStep();
    }
  }

  async sendTransaction(txParams) {
    return new Promise<TransactionResponse>(async (resolve, reject) => {
      const transInfo = window[transactionInfo];
      let toastProps: ToastOptions | UpdateOptions = {};
      let toastId = '';
      try {
        const price = await this.provider.getGasPrice();
        const gasPrice = utils.hexValue(Math.round(price.toNumber() * 1.04));
        const txHash = await this.ethereum.request({
          method: 'eth_sendTransaction',
          params: [{ ...txParams, gasPrice }],
        });
        let txInPoolIntervalTrigger = await this.provider.getTransaction(txHash);
        let txInPoolData: ethers.providers.TransactionResponse | null = null;

        const safeReorgHeight = (await this.getProvider.getBlockNumber()) - 20;
        let minedTx = null;
        let replacementTx: any = null;
        let link = '';
        const currentNetworkConfig = chainConfigs[window['accountInfo'].id];
        if (transInfo.networkSrc === 'BNB Smart Chain') {
          link = `${currentNetworkConfig.EXPLORE_URL}${currentNetworkConfig.exploreSuffix?.transaction}${txHash}`;
        }
        toastProps = {
          onClick: () => window.open(link, '_blank'),
        };
        toastId = txHash;

        const transactionMessages = getTransactionMessages(transInfo, window[SIGNING_ACTIONS.GLOBAL_NAME]);
        openToast({ message: transactionMessages.pending, id: toastId, options: toastProps });

        // For checking replacement tx by speeding up or cancelling tx from MetaMask
        const checkTxRs = setInterval(async () => {
          if (txInPoolIntervalTrigger) {
            txInPoolData = txInPoolIntervalTrigger;
          }

          if (!txInPoolIntervalTrigger && !minedTx && !replacementTx) {
            if (!txInPoolData) {
              console.error('No current transaction information.');
              clearInterval(checkTxRs);
              resolve({
                message: 'No current transaction information.',
                transactionStatus: TransactionStatus.failure,
                txParams,
              });
            }
            try {
              replacementTx = await findReplacementTx(this.provider, safeReorgHeight, {
                nonce: txInPoolData?.nonce,
                from: txInPoolData?.from,
                to: txInPoolData?.to,
                data: txInPoolData?.data,
              });
            } catch (error: any) {
              clearInterval(checkTxRs);
              const message = error.message || t`Transaction failed!`;
              openToast({ message, id: toastId, transactionStatus: TransactionStatus.failure, options: toastProps });
              resolve({
                message,
                txHash: toastId,
                transactionStatus: TransactionStatus.failure,
                transaction: txInPoolData,
                txParams,
              });
            }
          } else {
            txInPoolIntervalTrigger = await this.provider.getTransaction(txHash);
          }

          if (replacementTx) {
            clearInterval(checkTxRs);
            openToast({
              message: transactionMessages.success,
              id: toastId,
              transactionStatus: TransactionStatus.success,
              options: toastProps,
            });
            this.handleSuccessTx();
            resolve({
              message: transactionMessages.success,
              txHash: replacementTx.hash,
              transactionStatus: TransactionStatus.success,
              transaction: replacementTx,
              txParams,
            });
          }
        }, 3000);
        // Emitted when the transaction has been mined
        this.provider.once(txHash, transaction => {
          clearInterval(checkTxRs);
          minedTx = transaction;
          if (transaction.status === 1) {
            this.handleSuccessTx();
            openToast({
              message: transactionMessages.success,
              id: toastId,
              transactionStatus: TransactionStatus.success,
              options: toastProps,
            });
            resolve({
              txHash,
              transactionStatus: TransactionStatus.success,
              transaction: replacementTx,
              message: transactionMessages.success,
              txParams,
            });
          } else {
            openToast({
              message: transactionMessages.failure,
              id: toastId,
              transactionStatus: TransactionStatus.failure,
              options: toastProps,
            });
            resolve({
              message: transactionMessages.failure || t`Your transaction has failed. Please go back and try again.`,
              transactionStatus: TransactionStatus.failure,
              txParams,
            });
          }
        });
      } catch (error: any) {
        openToast({
          message: error.message,
          id: toastId,
          transactionStatus: TransactionStatus.failure,
          options: toastProps,
        });

        resolve({
          message: error.message,
          transactionStatus: TransactionStatus.failure,
          txParams,
        });
      }
    });
  }
}

const EthereumInstance = new Ethereum();

export { EthereumInstance };
