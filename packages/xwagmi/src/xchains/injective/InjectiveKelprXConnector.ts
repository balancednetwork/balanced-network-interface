import { XAccount } from '@/types';

// import KeplrIcon from '@/assets/wallets/keplr.svg?inline';
import { XConnector } from '@/core';
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
    const { keplr } = window as any;
    if (!keplr) {
      window.open('https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap?hl=en', '_blank');
      return;
    }

    this.getXService().walletStrategy.setWallet(Wallet.Keplr);
    const addresses = await this.getXService().walletStrategy.getAddresses();

    return {
      address: addresses?.[0],
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {}

  public get icon() {
    return 'https://google.com';
  }
}
