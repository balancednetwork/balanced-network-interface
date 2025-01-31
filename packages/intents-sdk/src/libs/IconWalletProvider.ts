import type { HttpPrefixedUrl, IconEoaAddress, Result } from '../types.js';
import { IconService, CallTransaction, Wallet as IconWallet, SignedTransaction } from 'icon-sdk-js';
import { requestJsonRpc } from './HanaWalletConnector.js';

export class IconWalletProvider {
  private readonly wallet: IconWallet | IconEoaAddress;
  public readonly iconService: IconService;
  public readonly iconDebugRpcUrl: HttpPrefixedUrl;

  constructor(wallet: IconWallet | IconEoaAddress, iconService: IconService, iconDebugRpcUrl: HttpPrefixedUrl) {
    this.wallet = wallet;
    this.iconService = iconService;
    this.iconDebugRpcUrl = iconDebugRpcUrl;
  }

  public async sendTransaction(tx: CallTransaction): Promise<Result<string>> {
    try {
      if (typeof this.wallet === 'string') {
        // if wallet is typeof string (address) - we prompt Icon wallet for signing and sending
        const result = await requestJsonRpc(tx);

        if (!result.ok) {
          return result;
        } else {
          return {
            ok: true,
            value: result.value.result,
          };
        }
      } else {
        const signedTx = new SignedTransaction(tx, this.wallet);
        const result: string = await this.iconService.sendTransaction(signedTx).execute();

        return {
          ok: true,
          value: result,
        };
      }
    } catch (e) {
      return {
        ok: false,
        error: e,
      };
    }
  }

  getAddress(): string {
    return typeof this.wallet === 'string' ? this.wallet : this.wallet.getAddress();
  }
}
