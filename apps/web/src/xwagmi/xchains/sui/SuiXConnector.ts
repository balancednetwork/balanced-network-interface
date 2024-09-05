import { XAccount } from '@/xwagmi/types';

import { XConnector } from '@/xwagmi/core';
import { SuiXService } from './SuiXService';

export class SuiXConnector extends XConnector {
  wallet: any;

  constructor(wallet: any) {
    // super('SUI', wallet.name, wallet.id);
    super('SUI', 'sui', 'sui');
    this.wallet = wallet;
  }

  getXService(): SuiXService {
    return SuiXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    return;
  }

  async disconnect(): Promise<void> {}
}
