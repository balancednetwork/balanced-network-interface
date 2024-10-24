import { XAccount } from '@/xwagmi/types';

import { XConnector } from '@/xwagmi/core';
import { SolanaXService } from './SolanaXService';

export class SolanaXConnector extends XConnector {
  wallet: any;
  constructor(wallet: any) {
    super('SOLANA', wallet?.adapter.name, wallet?.adapter.name);
    this.wallet = wallet;
  }

  getXService(): SolanaXService {
    return SolanaXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    return;
  }

  async disconnect(): Promise<void> {}

  public get icon() {
    return this.wallet?.icon;
  }
}
