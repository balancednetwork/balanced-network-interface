import { SupportedChainId as NetworkId } from '@balancednetwork/balanced-js';
import { createAction } from '@reduxjs/toolkit';

export type ICONTxEventLog = { data: string[]; indexed: string[]; scoreAddress: string };

export interface SerializableTransactionReceipt {
  to: string;
  from?: string;
  scoreAddress?: string;
  txIndex: number;
  blockHash: string;
  txHash: string;
  blockHeight: number;
  status?: number;
  eventLogs?: ICONTxEventLog[];
}

export const addTransaction = createAction<{
  networkId: NetworkId;
  hash: string;
  from: string;
  approval?: { tokenAddress: string; spender: string };
  claim?: { recipient: string };
  summary?: string;
  redirectOnSuccess?: string;
  isTxSuccessfulBasedOnEvents?: (eventLogs: ICONTxEventLog[]) => boolean;
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
