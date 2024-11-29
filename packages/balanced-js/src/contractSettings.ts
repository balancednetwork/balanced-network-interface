import IconService from 'icon-sdk-js';

import { CHAIN_INFO, SupportedChainId as NetworkId } from './chain';

export type AccountType = string | undefined | null;

const getDefaultProvider = (networkId: NetworkId = NetworkId.MAINNET) => {
  return new IconService(new IconService.HttpProvider(CHAIN_INFO[networkId].APIEndpoint));
};

class ContractSettings {
  networkId: NetworkId;
  provider: any;
  account: AccountType = '';
  walletProvider: any; // it's for havah - window.havah or window.hanaWallet.havah

  /**
   * @constructor
   * @param provider {Object} -
   * @param networkId {Number} -
   */
  constructor(contractSettings?: Partial<ContractSettings>) {
    contractSettings = contractSettings || {};
    const { provider, networkId, walletProvider } = contractSettings;
    this.networkId = networkId || 1;

    this.provider = provider || getDefaultProvider(this.networkId);
    this.walletProvider = walletProvider;
  }
}

export default ContractSettings;
