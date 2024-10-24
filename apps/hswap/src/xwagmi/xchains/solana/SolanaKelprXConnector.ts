import { XAccount } from '@/xwagmi/types';

import { XConnector } from '@/xwagmi/core';
import { SolanaXService } from './SolanaXService';

export class SolanaKelprXConnector extends XConnector {
  constructor() {
    super('SOLANA', 'Keplr', 'keplr');
  }

  getXService(): SolanaXService {
    return SolanaXService.getInstance();
  }

  async connect(): Promise<XAccount | undefined> {
    throw new Error('Method not implemented.');
  }

  async disconnect(): Promise<void> {}
}
