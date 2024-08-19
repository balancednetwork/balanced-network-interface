import { XService } from '@/xwagmi/core/XService';

export class ArchwayXService extends XService {
  private static instance: ArchwayXService;

  private constructor() {
    super('ARCHWAY');
  }

  public static getInstance(): ArchwayXService {
    if (!ArchwayXService.instance) {
      ArchwayXService.instance = new ArchwayXService();
    }
    return ArchwayXService.instance;
  }
}
