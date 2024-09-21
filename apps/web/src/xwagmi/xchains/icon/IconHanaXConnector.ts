import { XAccount } from '@/xwagmi/types';
import { ICONexRequestEventType, ICONexResponseEventType, request } from './iconex';

import { XConnector } from '@/xwagmi/core/XConnector';

export class IconHanaXConnector extends XConnector {
  constructor() {
    super('ICON', 'Hana Wallet', 'hana');
  }

  async connect(): Promise<XAccount | undefined> {
    // const { hanaWallet } = window as any;
    // if (!hanaWallet && !hanaWallet?.isAvailable) {
    //   window.open('https://chromewebstore.google.com/detail/hana-wallet/jfdlamikmbghhapbgfoogdffldioobgl', '_blank');
    //   return;
    // }

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
