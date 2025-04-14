import { MMTransaction, MMTransactionStatus, useMMTransactionStore } from '@/store/transactions/useMMTransactionStore';
import {
  Transaction,
  XTransaction,
  XTransactionStatus,
  useTransactionStore,
  useXTransactionStore,
} from '@balancednetwork/xwagmi';
import { useMemo } from 'react';

const isMMTransaction = (transaction: MMTransaction | XTransaction): transaction is MMTransaction => {
  return !!(transaction as MMTransaction).orderId;
};

const getTransactionTimestamp = (transaction: MMTransaction | XTransaction | Transaction): number => {
  if ('createdAt' in transaction) {
    return transaction.createdAt ?? 0;
  }
  if ('timestamp' in transaction) {
    return transaction.timestamp ?? 0;
  }
  return Date.now();
};

export const useCombinedTransactions = () => {
  const xTransactions = useXTransactionStore(state => state.getTransactions());
  const mmTransactions = useMMTransactionStore(state => Object.values(state.transactions));
  const txses = useTransactionStore(state => state.transactions);

  const sortedTransactions = useMemo(
    () => [...xTransactions, ...mmTransactions].sort((a, b) => getTransactionTimestamp(b) - getTransactionTimestamp(a)),
    [xTransactions, mmTransactions],
  );

  return {
    transactions: sortedTransactions,
    isMMTransaction,
  };
};

export const useIsAnyTxPending = (): boolean => {
  const { transactions } = useCombinedTransactions();
  const oneHourAgo = Date.now() - 60 * 60 * 1000; // 1 hour in milliseconds

  return transactions.some(tx => {
    const txTimestamp = getTransactionTimestamp(tx);
    if (txTimestamp < oneHourAgo) return false;

    if (isMMTransaction(tx)) {
      return tx.status === MMTransactionStatus.pending;
    } else {
      return tx.status === XTransactionStatus.pending;
    }
  });
};
