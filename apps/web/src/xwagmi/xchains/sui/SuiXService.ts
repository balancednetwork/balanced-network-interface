import { XService } from '@/xwagmi/core/XService';

export class SuiXService extends XService {
  private static instance: SuiXService;

  public suiClient: any;

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
