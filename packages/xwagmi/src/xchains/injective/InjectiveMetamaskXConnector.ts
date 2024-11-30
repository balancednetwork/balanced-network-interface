import { XAccount } from '@/types';

// import MetamaskIcon from '@/assets/wallets/metamask.svg?inline';
import { XConnector } from '@/core';
import { getInjectiveAddress } from '@injectivelabs/sdk-ts';
import { Wallet } from '@injectivelabs/wallet-ts';
import { InjectiveXService } from './InjectiveXService';

export class InjectiveMetamaskXConnector extends XConnector {
  constructor() {
    super('INJECTIVE', 'MetaMask', 'metamask');
  }

  getXService(): InjectiveXService {
    return InjectiveXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    const { ethereum } = window as any;
    if (!ethereum) {
      window.open('https://chromewebstore.google.com/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn?hl=en', '_blank');
      return;
    }

    this.getXService().walletStrategy.setWallet(Wallet.Metamask);
    const addresses = await this.getXService().walletStrategy.getAddresses();
    const injectiveAddresses = addresses.map(getInjectiveAddress);

    return {
      address: injectiveAddresses?.[0],
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {
    await this.getXService().walletStrategy.disconnect();
  }

  public get icon() {
    return 'https://google.com';
  }
}
