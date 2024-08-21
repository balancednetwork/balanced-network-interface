import { XAccount } from '@/xwagmi/core/types';

import MetamaskIcon from '@/assets/icons/wallets/metamask.svg?inline';
import { XConnector } from '@/xwagmi/core';
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
    return MetamaskIcon;
  }
}
