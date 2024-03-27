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

export interface TransactionSendingRequest {
  from?: string;
  to?: string;
  value?: string;
}

export interface TransactionSendingRequestOptions {
  method: string;
  params: { [key: string]: string };
  builder?: any;
  nid?: any;
  stepLimit?: number;
  timestamp?: number;
}

export interface ICXCallPayload {
  dataType: string;
  data: {
    method: string;
    params?: {
      [key: string]: any;
    };
  };
  to: string;
}

export interface Network {
  value: string;
  label: string;
  NETWORK_ADDRESS: string;
  [key: string]: any;
}

export interface TransferTransactionRequest {
  to: string;
  value: any;
  coinName: string;
  network: string;
}
