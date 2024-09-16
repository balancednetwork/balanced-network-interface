import { XService } from '@/xwagmi/core/XService';

export class StellarXService extends XService {
  private static instance: StellarXService;

  public walletKit: any;
  //probably add bunch of stuff here

  private constructor() {
    super('STELLAR');

    this.walletKit = 'create the kit here';
  }

  public static getInstance(): StellarXService {
    if (!StellarXService.instance) {
      StellarXService.instance = new StellarXService();
    }
    return StellarXService.instance;
  }
}
