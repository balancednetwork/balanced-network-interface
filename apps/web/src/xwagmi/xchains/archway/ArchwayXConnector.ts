import { NETWORK_ID } from '@/constants/config';
import { XConnector } from '@/xwagmi/core/XConnector';
import { XService } from '@/xwagmi/core/XService';
import { SupportedChainId } from '@balancednetwork/balanced-js';

export class ArchwayXConnector extends XConnector {
  constructor(xService: XService) {
    super(xService, 'Keplr');
  }

  async connect(): Promise<string | undefined> {
    // const { keplr } = window as any;
    // const { leap } = window as any;
    // if (!keplr && !leap) {
    //   window.open('https://chrome.google.com/webstore/detail/keplr/dmkamcknogkgcdfhhbddcghachkejeap?hl=en', '_blank');
    //   return;
    // }
    // if (NETWORK_ID === SupportedChainId.MAINNET) {
    //   keplr.defaultOptions = {
    //     sign: {
    //       preferNoSetFee: true,
    //     },
    //   };
    // }
    // if (NETWORK_ID === SupportedChainId.MAINNET) {
    //   if (leap) {
    //     await leap.enable(chainId);
    //   } else {
    //     await keplr.enable(chainId);
    //   }
    // }
    // // @ts-ignore
    // const offlineSigner = leap ? leap.getOfflineSignerOnlyAmino(chainId) : keplr.getOfflineSignerOnlyAmino(chainId);
    // const signingClientObj = await XSigningArchwayClient.connectWithSigner(rpcURL, offlineSigner);
    // setSigningClient(signingClientObj);
    // const account: AccountData = (await offlineSigner.getAccounts())[0];
    // account.address && setAddress(account.address);
    // account.address && setAddressStored(account.address);
    return;
  }

  async disconnect(): Promise<void> {
    // signingClient?.disconnect();
    // client?.disconnect();
    // setAddress('');
    // setSigningClient(undefined);
    // setClient(undefined);
    // setAddressStored(null);
  }
}
