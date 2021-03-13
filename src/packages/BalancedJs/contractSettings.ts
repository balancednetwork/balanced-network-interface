import IconService from 'icon-sdk-js';

export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

const connections = {
  [NetworkId.MAINNET]: 'https://ctz.solidwallet.io/api/v3',
  [NetworkId.YEOUIDO]: 'https://bicon.net.solidwallet.io/api/v3',
};

const getDefaultProvider = (networkId: NetworkId = NetworkId.MAINNET) => {
  return new IconService(new IconService.HttpProvider(connections[networkId]));
};

class ContractSettings {
  networkId: NetworkId;
  provider: any;
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
