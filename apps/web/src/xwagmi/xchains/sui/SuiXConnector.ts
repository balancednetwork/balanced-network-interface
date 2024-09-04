import { XAccount } from '@/xwagmi/types';

import { XConnector } from '@/xwagmi/core';
import { SuiXService } from './SuiXService';

export class SuiXConnector extends XConnector {
  constructor() {
    super('SUI', 'Sui', 'Sui');
  }

  getXService(): SuiXService {
    return SuiXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    const { keplr } = window as any;
    if (!keplr) {
      window.open('https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap?hl=en', '_blank');
      return;
    }

    const addresses = {};

    return {
      address: addresses?.[0],
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {}

  // public get icon() {
  //   return KeplrIcon;
  // }
}
