import HanaIcon from '@/xwagmi/assets/wallets/hana.svg?inline';
import { XConnector } from '@/xwagmi/core/XConnector';
import { XAccount } from '@/xwagmi/types';

interface AccountResultType {
  address: string;
  nid: string;
  error?: string;
}

export class HavahHanaXConnector extends XConnector {
  constructor() {
    super('HAVAH', 'Hana Wallet', 'hana');
  }

  async connect(): Promise<XAccount | undefined> {
    const {
      hanaWallet: { havah },
    } = window as any;
    if (!havah) {
      window.open('https://chromewebstore.google.com/detail/hana-wallet/jfdlamikmbghhapbgfoogdffldioobgl', '_blank');
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
    const {
      hanaWallet: { havah },
    } = window as any;
    if (havah?.disconnect) {
      havah.disconnect();
    }
  }

  public get icon() {
    return HanaIcon;
  }
}
