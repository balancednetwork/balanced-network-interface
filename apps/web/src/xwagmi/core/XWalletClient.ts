import { XTransactionInput } from '@/lib/xcall/_zustand/types';
import { XPublicClient } from './XPublicClient';

export interface XWalletClient extends XPublicClient {
  // getAllowance(token: XToken, owner: string | null, spender: string): Promise<string>;
  approve(token, owner, spender, currencyAmountToApprove);
  executeTransaction(xTransactionInput: XTransactionInput): Promise<string | undefined>;
}
