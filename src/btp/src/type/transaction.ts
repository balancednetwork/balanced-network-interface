import { TransactionStatus } from '../../../store/transactions/hooks';

export interface TransactionResponse {
  transaction?: any;
  txHash?: string;
  transactionStatus: TransactionStatus;
  message: string;
  txParams: any;
}

export interface EventPayload {
  jsonrpc: string;
  method: string;
  params: any;
  id: number;
}
