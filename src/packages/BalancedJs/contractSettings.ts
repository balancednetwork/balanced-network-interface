import IconService from 'icon-sdk-js';

import { AccountType, CHAIN_INFO } from '.';
import { SupportedChainId as NetworkId } from './chain';

export interface LedgerSettings {
  path?: string;
  transport?: any;
  actived?: boolean;
}

export const LEDGER_BASE_PATH = "44'/4801368'/0'/0'";

export const getLedgerAddressPath = (point: number) => `${LEDGER_BASE_PATH}/${point}'`;

const getDefaultProvider = (networkId: NetworkId = NetworkId.MAINNET) => {
  return new IconService(new IconService.HttpProvider(CHAIN_INFO[networkId].APIEndpoint));
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

  resetLedgerSettings() {
    this.ledgerSettings.path = LEDGER_BASE_PATH;
    this.ledgerSettings.transport = null;
    this.ledgerSettings.actived = false;
  }
}

export default ContractSettings;
