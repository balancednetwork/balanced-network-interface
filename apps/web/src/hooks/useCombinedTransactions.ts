import { MMTransaction, MMTransactionStatus, useMMTransactionStore } from '@/store/transactions/useMMTransactionStore';
import { Transaction, XTransaction, XTransactionStatus, useXTransactionStore } from '@balancednetwork/xwagmi';
import { useMemo } from 'react';

const isMMTransaction = (transaction: MMTransaction | XTransaction): transaction is MMTransaction => {
  return !!(transaction as MMTransaction).orderId;
};

export const useCombinedTransactions = (): {
  transactions: (MMTransaction | XTransaction)[];
  isMMTransaction: (transaction: MMTransaction | XTransaction) => transaction is MMTransaction;
} => {
  const xTransactions = useXTransactionStore(state => state.getTransactions());
  const mmTransactions = useMMTransactionStore(state => Object.values(state.transactions));

  const sortedTransactions = useMemo(
    () => [...xTransactions, ...mmTransactions].sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)),
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
    if (tx.createdAt && tx.createdAt < oneHourAgo) return false;

    if (isMMTransaction(tx)) {
      return tx.status === MMTransactionStatus.pending;
    } else {
      return tx.status === XTransactionStatus.pending;
    }
  });
};
