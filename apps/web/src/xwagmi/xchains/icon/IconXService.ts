import { XService } from '@/xwagmi/core/XService';
import IconService from 'icon-sdk-js';

import { CHAIN_INFO } from '@balancednetwork/balanced-js';

export const NETWORK_ID: number = parseInt(process.env.REACT_APP_NETWORK_ID ?? '1');

export class IconXService extends XService {
  private static instance: IconXService;

  public iconService: IconService;

  private constructor() {
    super('ICON');
    this.iconService = new IconService(new IconService.HttpProvider(CHAIN_INFO[NETWORK_ID].APIEndpoint));
  }

  public static getInstance(): IconXService {
    if (!IconXService.instance) {
      IconXService.instance = new IconXService();
    }
    return IconXService.instance;
  }
}
