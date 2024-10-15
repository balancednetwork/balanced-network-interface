import { XTransactionInput } from '@/xwagmi/xcall/types';
import { CurrencyAmount, XChainId, XToken } from '@balancednetwork/sdk-core';

export abstract class XWalletClient {
  public xChainId: XChainId;

  constructor(xChainId: XChainId) {
    this.xChainId = xChainId;
  }

  abstract approve(
    token: XToken,
    owner: string,
    spender: string,
    amountToApprove: CurrencyAmount<XToken>,
  ): Promise<string | undefined>;

  abstract executeTransaction(xTransactionInput: XTransactionInput, options?: any): Promise<string | undefined>;
}
