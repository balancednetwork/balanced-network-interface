import { XConnector } from '@/xwagmi/core/XConnector';
import { XService } from '@/xwagmi/core/XService';
import { AccountData } from '@keplr-wallet/types';
import { ArchwayXService } from './ArchwayXService';
import { XSigningArchwayClient } from './XSigningArchwayClient';

export class ArchwayXConnector extends XConnector {
  constructor(xService: XService) {
    super(xService, 'Keplr');
  }

  getXService(): ArchwayXService {
    return this.xService as ArchwayXService;
  }

  async connect(): Promise<string | undefined> {
    const { keplr } = window as any;
    const { leap } = window as any;
    if (!keplr && !leap) {
      window.open('https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap?hl=en', '_blank');
      return;
    }

    keplr.defaultOptions = {
      sign: {
        preferNoSetFee: true,
      },
    };

    const chainId = this.getXService().chainId;
    if (leap) {
      await leap.enable(chainId);
    } else {
      await keplr.enable(chainId);
    }

    // @ts-ignore
    const offlineSigner = leap ? leap.getOfflineSignerOnlyAmino(chainId) : keplr.getOfflineSignerOnlyAmino(chainId);
    const signingClientObj = await XSigningArchwayClient.connectWithSigner(this.getXService().rpcURL, offlineSigner);

    this.getXService().setWalletClient(signingClientObj);

    const account: AccountData = (await offlineSigner.getAccounts())[0];
    return account?.address;
  }

  async disconnect(): Promise<void> {
    this.getXService().walletClient?.disconnect();
    this.getXService().setWalletClient(null);

    // TODO: need to disconnect public client?
    // this.getXService().publicClient?.disconnect();
  }
}
