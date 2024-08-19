import { ICONexRequestEventType, ICONexResponseEventType, request } from '@/packages/iconex';

import { XConnector } from '@/xwagmi/core/XConnector';
import { XService } from '@/xwagmi/core/XService';

export class IconHanaXConnector extends XConnector {
  constructor() {
    super('ICON', 'Hana Wallet');
  }

  async connect(): Promise<string | undefined> {
    console.log('HanaIconXConnector connected');

    const detail = await request({
      type: ICONexRequestEventType.REQUEST_ADDRESS,
    });

    if (detail?.type === ICONexResponseEventType.RESPONSE_ADDRESS) {
      return detail?.payload;
    }
  }

  async disconnect(): Promise<void> {
    console.log('HanaIconXConnector disconnected');
  }
}
