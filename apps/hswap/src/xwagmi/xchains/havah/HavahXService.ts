import { XService } from '@/xwagmi/core/XService';

export class HavahXService extends XService {
  private static instance: HavahXService;

  public walletClient: any;

  private constructor() {
    super('HAVAH');
  }

  public static getInstance(): HavahXService {
    if (!HavahXService.instance) {
      HavahXService.instance = new HavahXService();
    }
    return HavahXService.instance;
  }
}
