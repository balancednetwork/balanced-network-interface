import { createReducer } from '@reduxjs/toolkit';

import {
  addTransaction,
  checkedTransaction,
  clearAllTransactions,
  finalizeTransaction,
  SerializableTransactionReceipt,
} from './actions';

const now = () => new Date().getTime();

export interface TransactionDetails {
  hash: string;
  approval?: { tokenAddress: string; spender: string };
  summary?: string;
  claim?: { recipient: string };
  receipt?: SerializableTransactionReceipt;
  lastCheckedBlockNumber?: number;
  addedTime: number;
  confirmedTime?: number;
  from: string;
  redirectOnSuccess?: string;
  isTxSuccessfulBasedOnEvents?: (eventLogs: any[]) => boolean;
}

export interface TransactionState {
  [networkId: number]: {
    [txHash: string]: TransactionDetails;
  };
}

export const initialState: TransactionState = {};

export default createReducer(initialState, builder =>
  builder
    .addCase(
      addTransaction,
      (
        transactions,
        {
          payload: { networkId, from, hash, approval, summary, claim, redirectOnSuccess, isTxSuccessfulBasedOnEvents },
        },
      ) => {
        if (transactions[networkId]?.[hash]) {
          throw Error('Attempted to add existing transaction.');
        }
        const txs = transactions[networkId] ?? {};
        txs[hash] = {
          hash,
          approval,
          summary,
          claim,
          from,
          addedTime: now(),
          redirectOnSuccess,
          isTxSuccessfulBasedOnEvents,
        };
        transactions[networkId] = txs;
      },
    )
    .addCase(clearAllTransactions, (transactions, { payload: { networkId } }) => {
      if (!transactions[networkId]) return;
      transactions[networkId] = {};
    })
    .addCase(checkedTransaction, (transactions, { payload: { networkId, hash, blockNumber } }) => {
      const tx = transactions[networkId]?.[hash];
      if (!tx) {
        return;
      }
      if (!tx.lastCheckedBlockNumber) {
        tx.lastCheckedBlockNumber = blockNumber;
      } else {
        tx.lastCheckedBlockNumber = Math.max(blockNumber, tx.lastCheckedBlockNumber);
      }
    })
    .addCase(finalizeTransaction, (transactions, { payload: { hash, networkId, receipt } }) => {
      const tx = transactions[networkId]?.[hash];
      if (!tx) {
        return;
      }
      tx.receipt = receipt;
      tx.confirmedTime = now();
    }),
);
