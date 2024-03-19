import AppIcx from '@balancednetwork/hw-app-icx';
import IconService from 'icon-sdk-js';

import ContractSettings, { LedgerSettings } from './contractSettings';

const { IconUtil } = IconService;

export class Ledger {
  actived: boolean = false;

  constructor(private contractSettings: ContractSettings) {}

  viewSetting(): LedgerSettings {
    return this.contractSettings.ledgerSettings;
  }

  async signTransaction(rawTransaction: any): Promise<any> {
    const icx = new AppIcx(this.contractSettings.ledgerSettings.transport) as any;
    const hashKey = IconUtil.generateHashKey(rawTransaction);
    const { signedRawTxBase64 } = await icx.signTransaction(this.contractSettings.ledgerSettings.path, hashKey);

    rawTransaction.signature = signedRawTxBase64;

    return {
      getProperties: () => rawTransaction,
      getSignature: () => signedRawTxBase64
    };
  }
}
