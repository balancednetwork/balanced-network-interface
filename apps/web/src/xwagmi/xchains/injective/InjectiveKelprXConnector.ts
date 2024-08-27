import { XAccount } from '@/xwagmi/types';

import KeplrIcon from '@/assets/icons/wallets/keplr.svg?inline';
import { XConnector } from '@/xwagmi/core';
import { Wallet } from '@injectivelabs/wallet-ts';
import { InjectiveXService } from './InjectiveXService';

export class InjectiveKelprXConnector extends XConnector {
  constructor() {
    super('INJECTIVE', 'Keplr', 'keplr');
  }

  getXService(): InjectiveXService {
    return InjectiveXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    this.getXService().walletStrategy.setWallet(Wallet.Keplr);
    const addresses = await this.getXService().walletStrategy.getAddresses();

    return {
      address: addresses?.[0],
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {}

  public get icon() {
    return KeplrIcon;
  }
}
