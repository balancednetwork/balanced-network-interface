import { XTransactionInput } from '@/xwagmi/xcall/types';
import { CurrencyAmount, XChainId, XToken } from '@balancednetwork/sdk-core';

export abstract class XWalletClient {
  public xChainId: XChainId;

  constructor(xChainId: XChainId) {
    this.xChainId = xChainId;
  }

  abstract approve(
    amountToApprove: CurrencyAmount<XToken>,
    spender: string,
    owner: string,
  ): Promise<string | undefined>;

  abstract executeTransaction(xTransactionInput: XTransactionInput, options?: any): Promise<string | undefined>;
}
