import { XConnector } from '@/xwagmi/core/XConnector';
import { XService } from '@/xwagmi/core/XService';

interface AccountResultType {
  address: string;
  nid: string;
  error?: string;
}

export class HavahXConnector extends XConnector {
  constructor() {
    super('HAVAH', 'Havah Wallet');
  }

  async connect(): Promise<string | undefined> {
    const { havah } = window as any;
    if (!havah) {
      window.open(
        'https://chromewebstore.google.com/detail/havah-wallet/cnncmdhjacpkmjmkcafchppbnpnhdmon?hl=en',
        '_blank',
      );
      return;
    }

    await havah.connect();
    const account: AccountResultType = await havah.accounts();
    if (account.address) {
      return account.address;
    }
  }

  async disconnect(): Promise<void> {
    const { havah } = window as any;
    if (havah?.disconnect) {
      havah.disconnect();
    }
  }
}
