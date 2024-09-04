import { XService } from '@/xwagmi/core/XService';
import IconService from 'icon-sdk-js';

import { CHAIN_INFO } from '@balancednetwork/balanced-js';

export class IconXService extends XService {
  private static instance: IconXService;

  public iconService: IconService;

  private constructor() {
    super('ICON');
    this.iconService = new IconService(new IconService.HttpProvider(CHAIN_INFO[1].APIEndpoint));
  }

  public static getInstance(): IconXService {
    if (!IconXService.instance) {
      IconXService.instance = new IconXService();
    }
    return IconXService.instance;
  }
}
