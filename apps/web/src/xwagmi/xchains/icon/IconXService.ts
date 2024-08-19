import { XService } from '@/xwagmi/core/XService';

export class IconXService extends XService {
  private static instance: IconXService;

  private constructor() {
    super('ICON');
  }

  public static getInstance(): IconXService {
    if (!IconXService.instance) {
      IconXService.instance = new IconXService();
    }
    return IconXService.instance;
  }
}
