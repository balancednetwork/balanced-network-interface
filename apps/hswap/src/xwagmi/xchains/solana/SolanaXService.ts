import { XService } from '@/xwagmi/core/XService';

export class SolanaXService extends XService {
  private static instance: SolanaXService;

  private constructor() {
    super('SOLANA');
  }

  public static getInstance(): SolanaXService {
    if (!SolanaXService.instance) {
      SolanaXService.instance = new SolanaXService();
    }
    return SolanaXService.instance;
  }
}
