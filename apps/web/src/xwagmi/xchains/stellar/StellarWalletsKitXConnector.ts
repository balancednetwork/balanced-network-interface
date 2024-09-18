import { XAccount } from '@/xwagmi/types';

import { XConnector } from '@/xwagmi/core';
import { FREIGHTER_ID } from '@creit.tech/stellar-wallets-kit';
import { Wallet } from '@injectivelabs/wallet-ts';
import { StellarXService } from './StellarXService';

export class StellarWalletsKitXConnector extends XConnector {
  constructor() {
    super('STELLAR', 'Freighter', 'freighter-id');
  }

  getXService(): StellarXService {
    return StellarXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    const kit = this.getXService().walletsKit;

    //todo: support all supported wallets
    const wallets = await kit.getSupportedWallets();
    const freighterWallet = wallets.find(wallet => wallet.id === FREIGHTER_ID);

    if (!freighterWallet || !freighterWallet.isAvailable) {
      window.open('https://chromewebstore.google.com/detail/freighter/bcacfldlkkdogcmkkibnjlakofdplcbk', '_blank');
      return;
    }

    kit.setWallet(FREIGHTER_ID);
    const { address } = await kit.getAddress();

    return {
      address: address,
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {}

  public get icon() {
    return this._icon;
  }
}
