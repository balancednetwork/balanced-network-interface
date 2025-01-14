import { XService } from '@/core/XService';

export class SuiXService extends XService {
  private static instance: SuiXService;

  public suiClient: any; // TODO: define suiClient type
  public suiWallet: any; // TODO: define suiWallet type
  public suiAccount: any; // TODO: define suiAccount type

  private constructor() {
    super('SUI');
  }

  public static getInstance(): SuiXService {
    if (!SuiXService.instance) {
      SuiXService.instance = new SuiXService();
    }
    return SuiXService.instance;
  }
}
