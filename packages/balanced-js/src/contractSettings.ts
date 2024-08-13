import IconService from 'icon-sdk-js';

import { SupportedChainId as NetworkId, CHAIN_INFO } from './chain';

export type AccountType = string | undefined | null;

const getDefaultProvider = (networkId: NetworkId = NetworkId.MAINNET) => {
  return new IconService(new IconService.HttpProvider(CHAIN_INFO[networkId].APIEndpoint));
};

class ContractSettings {
  networkId: NetworkId;
  provider: any;
  account: AccountType = '';

  /**
   * @constructor
   * @param provider {Object} -
   * @param networkId {Number} -
   */
  constructor(contractSettings?: Partial<ContractSettings>) {
    contractSettings = contractSettings || {};
    const { provider, networkId } = contractSettings;
    this.networkId = networkId || 1;

    this.provider = provider || getDefaultProvider(this.networkId);
  }
}

export default ContractSettings;
