import { XTransactionInput } from '@/xcall/types';
import { CurrencyAmount } from '@balancednetwork/sdk-core';
import { XChainId, XToken } from '../types';
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
