import AppIcx from '@ledgerhq/hw-app-icx';
import { IconUtil, SignedTransaction } from 'icon-sdk-js';

import ContractSettings, { LedgerSettings } from './contractSettings';

export class Ledger {
  actived: boolean = false;

  constructor(private contractSettings: ContractSettings) {}

  viewSetting(): LedgerSettings {
    return this.contractSettings.ledgerSettings;
  }

  async signTransaction(rawTransaction: any): Promise<SignedTransaction> {
    const icx = new AppIcx(this.contractSettings.ledgerSettings.transport);
    const hashKey = IconUtil.generateHashKey(rawTransaction);
    const { signedRawTxBase64 } = await icx.signTransaction(this.contractSettings.ledgerSettings.path, hashKey);

    rawTransaction.signature = signedRawTxBase64;

    return {
      getProperties: () => rawTransaction,
      getSignature: () => signedRawTxBase64,
    };
  }
}

export const ledgerConfirmAlert = msg => window.confirm(msg);
