import IconService from 'icon-sdk-js';

import { AccountType } from '.';

export enum NetworkId {
  MAINNET = 1,
  YEOUIDO = 3,
  EULJIRO = 2,
  PAGODA = 80,
}

export interface LedgerSettings {
  path?: string;
  transport?: any;
  actived?: boolean;
}

export const LEDGER_BASE_PATH = "44'/4801368'/0'/0'";

export const getLedgerAddressPath = (point: number) => `${LEDGER_BASE_PATH}/${point}'`;

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
  account: AccountType = '';
  ledgerSettings: LedgerSettings = {
    path: LEDGER_BASE_PATH,
    transport: null,
    actived: false,
  };

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
