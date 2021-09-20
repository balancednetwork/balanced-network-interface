import { createAction } from '@reduxjs/toolkit';
import { SupportedChainId as NetworkId } from 'packages/BalancedJs';

export interface SerializableTransactionReceipt {
  to: string;
  from: string;
  scoreAddress: string;
  txIndex: number;
  blockHash: string;
  txHash: string;
  blockHeight: number;
  status?: number;
}

export const addTransaction = createAction<{
  networkId: NetworkId;
  hash: string;
  from: string;
  approval?: { tokenAddress: string; spender: string };
  claim?: { recipient: string };
  summary?: string;
}>('transactions/addTransaction');
export const clearAllTransactions = createAction<{ networkId: NetworkId }>('transactions/clearAllTransactions');
export const finalizeTransaction = createAction<{
  networkId: NetworkId;
  hash: string;
  receipt: SerializableTransactionReceipt;
}>('transactions/finalizeTransaction');
export const checkedTransaction = createAction<{
  networkId: NetworkId;
  hash: string;
  blockNumber: number;
}>('transactions/checkedTransaction');
