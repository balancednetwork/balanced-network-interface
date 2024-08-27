import { ICONexRequestEventType, ICONexResponseEventType, request } from '@/packages/iconex';
import { XAccount } from '@/xwagmi/types';

import { XConnector } from '@/xwagmi/core/XConnector';

export class IconHanaXConnector extends XConnector {
  constructor() {
    super('ICON', 'Hana Wallet', 'hana');
  }

  async connect(): Promise<XAccount | undefined> {
    console.log('HanaIconXConnector connected');

    const detail = await request({
      type: ICONexRequestEventType.REQUEST_ADDRESS,
    });

    if (detail?.type === ICONexResponseEventType.RESPONSE_ADDRESS) {
      return {
        address: detail?.payload,
        xChainType: this.xChainType,
      };
    }
  }

  async disconnect(): Promise<void> {
    console.log('HanaIconXConnector disconnected');
  }
}
