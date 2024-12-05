import { XAccount } from '@/types';

import { XConnector } from '@/core';
import { StellarXService } from './StellarXService';
import { StellarWalletType } from './useStellarXConnectors';

export class StellarWalletsKitXConnector extends XConnector {
  _wallet: StellarWalletType;

  constructor(wallet: StellarWalletType) {
    super('STELLAR', wallet.name, wallet.id);
    this._wallet = wallet;
  }

  getXService(): StellarXService {
    return StellarXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    const kit = this.getXService().walletsKit;

    if (!this._wallet) {
      return;
    }

    if (!this._wallet.isAvailable && this._wallet.url) {
      window.open(this._wallet.url, '_blank');
      return;
    }

    kit.setWallet(this._wallet.id);
    const { address } = await kit.getAddress();

    return {
      address: address,
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {}

  public get icon() {
    return this._wallet.icon;
  }
}
