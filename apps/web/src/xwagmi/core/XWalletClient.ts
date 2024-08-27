import { XChainId } from '@/types';
import { XTransactionInput } from '@/xwagmi/xcall/_zustand/types';

export abstract class XWalletClient {
  public xChainId: XChainId;

  constructor(xChainId: XChainId) {
    this.xChainId = xChainId;
  }
  // getAllowance(token: XToken, owner: string | null, spender: string): Promise<string>;
  abstract approve(token, owner, spender, currencyAmountToApprove);
  abstract executeTransaction(xTransactionInput: XTransactionInput): Promise<string | undefined>;
}
