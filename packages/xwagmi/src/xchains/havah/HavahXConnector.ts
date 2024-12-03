// import HavahIcon from '@/assets/wallets/havah.svg?inline';
import { XConnector } from '@/core/XConnector';
import { XAccount } from '@/types';

interface AccountResultType {
  address: string;
  nid: string;
  error?: string;
}

export class HavahXConnector extends XConnector {
  constructor() {
    super('HAVAH', 'Havah Wallet', 'havah');
  }

  async connect(): Promise<XAccount | undefined> {
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
    return {
      address: account.address,
      xChainType: this.xChainType,
    };
  }

  async disconnect(): Promise<void> {
    const { havah } = window as any;
    if (havah?.disconnect) {
      havah.disconnect();
    }
  }

  public get icon() {
    return 'https://google.com';
  }
}